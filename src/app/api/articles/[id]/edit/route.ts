import { NextResponse } from 'next/server';

import { ArticleWriteValidationError } from '@/lib/articles/articleWriteRelations';
import { invalidateArticleCache } from '@/lib/articles/invalidateArticleCache';
import { notifyArticleOutcome } from '@/lib/articles/notifyArticleOutcome';
import {
  ArticleRequestConflictError,
  submitArticleRequest,
} from '@/lib/articles/submitArticleRequest';
import {
  ArticleRefreshRequiredError,
  ArticleVersionConflictError,
} from '@/lib/articles/versionConflict';
import { canAccess } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { getRequestIp, requireNotBlocked } from '@/lib/blocks/server';
import { InvalidPublishOperationIdError } from '@/lib/gameData/publishOperation';
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
      .maybeSingle();

    if (articleError) throw articleError;
    if (!article) {
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
        {
          error: 'Invalid request body',
          code: 'invalid_article_body',
          details: formatZodError(parsed.error),
        },
        { status: 400 }
      );
    }
    const { title, category } = parsed.data;
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

    const submittedVersion = await submitArticleRequest({
      request,
      actorId: userId,
      ip: getRequestIp(request),
      articleId: id,
      draft: parsed.data,
    });

    const refreshResult = invalidateArticleCache({
      articleId: id,
      versionId: submittedVersion.submitted_version_id,
      status: submittedVersion.submitted_status,
    });
    if (!submittedVersion.replayed) {
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
        data: [submittedVersion],
        article_id: id,
        version_id: submittedVersion.submitted_version_id,
        status: submittedVersion.submitted_status,
        ...refreshResult,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof ArticleVersionConflictError) {
      return NextResponse.json(
        { error: err.message, code: 'article_edit_conflict' },
        { status: 409 }
      );
    }
    if (err instanceof ArticleRefreshRequiredError) {
      return NextResponse.json(
        { error: err.message, code: 'article_refresh_required' },
        { status: 409 }
      );
    }
    if (err instanceof InvalidPublishOperationIdError) {
      return NextResponse.json(
        { error: '提交缺少有效的重试标识，请保存当前内容并刷新页面后重试。' },
        { status: 400 }
      );
    }
    if (err instanceof ArticleRequestConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof ArticleWriteValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
