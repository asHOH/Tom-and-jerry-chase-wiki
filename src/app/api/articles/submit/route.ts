import { NextResponse } from 'next/server';

import { ArticleWriteValidationError } from '@/lib/articles/articleWriteRelations';
import { invalidateArticleCache } from '@/lib/articles/invalidateArticleCache';
import { notifyArticleOutcome } from '@/lib/articles/notifyArticleOutcome';
import {
  ArticleRequestConflictError,
  submitArticleRequest,
} from '@/lib/articles/submitArticleRequest';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getRequestIp } from '@/lib/blocks/server';
import { InvalidPublishOperationIdError } from '@/lib/gameData/publishOperation';
import { checkRateLimit } from '@/lib/rateLimit';
import { articleSubmitSchema, formatZodError } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  const rl = await checkRateLimit(req, 'write', 'articles-submit');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers });
  }

  const parsed = articleSubmitSchema.safeParse(await req.json().catch(() => null));
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
    const submittedVersion = await submitArticleRequest({
      request: req,
      actorId: userId,
      ip: getRequestIp(req),
      draft: parsed.data,
    });
    const newArticleId = submittedVersion.article_id;

    const refreshResult = invalidateArticleCache({
      articleId: newArticleId,
      versionId: submittedVersion.submitted_version_id,
      status: submittedVersion.submitted_status,
    });
    if (!submittedVersion.replayed) {
      await notifyArticleOutcome({
        source: 'create',
        articleId: newArticleId,
        versionId: submittedVersion.submitted_version_id,
        status: submittedVersion.submitted_status,
        userId,
        title,
        categoryId: category,
      });
    }

    return NextResponse.json({
      message: 'Article submitted successfully',
      article_id: newArticleId,
      version_id: submittedVersion.submitted_version_id,
      status: submittedVersion.submitted_status,
      ...refreshResult,
    });
  } catch (err) {
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
