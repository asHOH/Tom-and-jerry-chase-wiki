import { NextResponse } from 'next/server';

import {
  ArticleWriteValidationError,
  resolveArticleCharacterForWrite,
} from '@/lib/articles/articleWriteRelations';
import { invalidateArticleCache } from '@/lib/articles/invalidateArticleCache';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getRequestIp } from '@/lib/blocks/server';
import { notifyArticleVersionSubscribers, publishNotification } from '@/lib/notificationUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { articleSubmitSchema, formatZodError } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  const rl = await checkRateLimit(req, 'write', 'articles-submit');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const parsed = articleSubmitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: formatZodError(parsed.error) },
      { status: 400 }
    );
  }
  const { title, category, content, character_id } = parsed.data;
  const guard = await requirePermission(
    'article.create',
    {
      resourceType: 'categories',
      resourceId: category,
    },
    'all',
    { request: req, blockAction: 'edit' }
  );
  if ('error' in guard) return guard.error;
  const { userId } = guard;

  try {
    const resolvedCharacterId = await resolveArticleCharacterForWrite({
      categoryId: category,
      characterId: character_id,
    });
    const { data: submittedVersions, error: rpcError } = await requireSupabaseAdminClient().rpc(
      'prepared_create_article',
      {
        p_actor_id: userId,
        p_ip: getRequestIp(req),
        p_title: title,
        p_content: content,
        p_category_id: category,
        p_character_id: resolvedCharacterId,
      }
    );

    if (rpcError) {
      console.error('Supabase RPC error:', rpcError);
      return NextResponse.json({ error: 'Failed to submit article version' }, { status: 500 });
    }

    const submittedVersion = submittedVersions?.[0];
    const newArticleId = submittedVersion?.article_id;
    if (!submittedVersion || !newArticleId) {
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }

    const refreshResult = invalidateArticleCache({
      articleId: newArticleId,
      versionId: submittedVersion.submitted_version_id,
      status: submittedVersion.submitted_status,
    });
    if (submittedVersion?.submitted_status === 'pending') {
      try {
        await notifyArticleVersionSubscribers({
          actorUserId: userId,
          articleId: newArticleId,
          articleTitle: title,
          proposedCategoryId: category,
          versionId: submittedVersion.submitted_version_id,
        });
      } catch (notificationError) {
        console.error('Failed to publish article pending-review notifications:', notificationError);
      }
    }

    if (
      submittedVersion &&
      (submittedVersion.submitted_status === 'approved' ||
        submittedVersion.submitted_status === 'rejected')
    ) {
      const approved = submittedVersion.submitted_status === 'approved';
      try {
        await publishNotification({
          recipientUserId: userId,
          kind: approved ? 'article_version_approved' : 'article_version_rejected',
          decisionOrigin: 'automatic',
          title: approved ? '文章已自动通过审核' : '文章未通过审核',
          body: approved
            ? `您的文章《${title}》已自动通过审核并发布。`
            : `您的文章《${title}》未通过自动审核。`,
          href: approved ? `/articles/${newArticleId}/` : '/articles/pending/',
          sourceIds: [submittedVersion.submitted_version_id],
          dedupeKey: `article-version:${submittedVersion.submitted_version_id}:${submittedVersion.submitted_status}`,
        });
      } catch (notificationError) {
        console.error('Failed to publish automatic article notification:', notificationError);
      }
    }

    return NextResponse.json({
      message: 'Article submitted successfully',
      article_id: newArticleId,
      ...refreshResult,
    });
  } catch (err) {
    if (err instanceof ArticleWriteValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
