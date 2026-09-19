import { NextResponse } from 'next/server';

import {
  ArticleWriteValidationError,
  resolveArticleCharacterForWrite,
} from '@/lib/articles/articleWriteRelations';
import { invalidateArticleCache } from '@/lib/articles/invalidateArticleCache';
import { notifyArticleOutcome } from '@/lib/articles/notifyArticleOutcome';
import { canAccess } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { getRequestIp, requireNotBlocked } from '@/lib/blocks/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { createClient } from '@/lib/supabase/server';
import { articleEditSchema, formatZodError } from '@/lib/validation/schemas';

export async function POST(request: Request, { params }: { params: Promise<{ id?: string }> }) {
  const rl = await checkRateLimit(request, 'write', 'articles-edit');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const id = (await params)?.id;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }

  try {
    // Authorize before parsing body — fail fast on missing article or insufficient permissions
    const { data: article, error: articleError } = await requireSupabaseAdminClient()
      .from('articles')
      .select('author_id, category_id')
      .eq('id', id)
      .single();

    if (articleError) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const grants = await loadPermissionGrants(supabase);
    const articleContext = { resourceType: 'articles', resourceId: id };
    const categoryContext = { resourceType: 'categories', resourceId: article.category_id };
    const canUpdateAny =
      canAccess(grants, 'article.update_any', articleContext) ||
      canAccess(grants, 'article.update_any', categoryContext);
    const canUpdateOwn =
      article.author_id === userId &&
      (canAccess(grants, 'article.update_own', articleContext) ||
        canAccess(grants, 'article.update_own', categoryContext));
    if (!canUpdateAny && !canUpdateOwn) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const initialBlock = await requireNotBlocked({
      request,
      userId,
      action: 'edit',
      contexts: [{ resourceType: 'articles', resourceId: id }],
    });
    if (initialBlock) return initialBlock;

    // Authorization passed — now parse and validate the body
    const parsed = articleEditSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { title, category, content, character_id, commit_message } = parsed.data;
    if (
      category !== article.category_id &&
      !canAccess(grants, canUpdateAny ? 'article.update_any' : 'article.update_own', {
        resourceType: 'categories',
        resourceId: category,
      })
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const block = await requireNotBlocked({
      request,
      userId,
      action: 'edit',
      contexts: [
        { resourceType: 'articles', resourceId: id },
        { resourceType: 'categories', resourceId: category },
      ],
    });
    if (block) return block;

    const resolvedCharacterId = await resolveArticleCharacterForWrite({
      categoryId: category,
      characterId: character_id,
    });

    const { data, error } = await requireSupabaseAdminClient().rpc('prepared_submit_article', {
      p_actor_id: userId,
      p_ip: getRequestIp(request),
      p_article_id: id,
      p_title: title,
      p_content: content,
      p_category_id: category,
      p_character_id: resolvedCharacterId,
      p_commit_message: commit_message,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }

    const submittedVersion = data?.[0];
    if (!submittedVersion) {
      console.error('Committed article edit returned no version:', { articleId: id });
    }
    const refreshResult = invalidateArticleCache({
      articleId: id,
      versionId: submittedVersion?.submitted_version_id ?? 'unknown',
      // Conservatively expire public content if a committed RPC omits its result.
      status: submittedVersion?.submitted_status ?? 'approved',
    });
    if (submittedVersion) {
      await notifyArticleOutcome({
        source: 'edit',
        articleId: id,
        versionId: submittedVersion.submitted_version_id,
        status: submittedVersion.submitted_status,
        userId,
        title,
        categoryId: category,
      });
    }

    return NextResponse.json(
      {
        message: 'Article updated successfully',
        data,
        article_id: id,
        version_id: submittedVersion?.submitted_version_id ?? null,
        status: submittedVersion?.submitted_status ?? null,
        ...refreshResult,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof ArticleWriteValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
