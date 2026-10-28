import { resolveArticleCharacterForWrite } from '@/lib/articles/articleWriteRelations';
import { requirePermission } from '@/lib/auth/requirePermission';
import { invalidateCache } from '@/lib/cacheTags';
import { notifyArticleVersionSubscribers, publishNotification } from '@/lib/notificationUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { POST } from './route';

function jsonResponse(body: unknown, init?: { status?: number; headers?: HeadersInit }) {
  return {
    status: init?.status ?? 200,
    headers: init?.headers ?? {},
    json: async () => body,
  } as Response;
}

jest.mock('@/lib/users/publicProfile', () => ({ getPublicUserSubmissionHref: jest.fn() }));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(jsonResponse),
  },
}));

jest.mock('@/lib/articles/articleWriteRelations', () => ({
  ArticleWriteValidationError: class ArticleWriteValidationError extends Error {},
  resolveArticleCharacterForWrite: jest.fn(),
}));

jest.mock('@/lib/auth/requirePermission', () => ({
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/blocks/server', () => ({
  getRequestIp: jest.fn(() => null),
}));

jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: {
    article: (id: string) => `article:${id}`,
    articleVersions: (id: string) => `article-versions:${id}`,
    articles: 'articles',
    articlePreviews: 'article-previews',
    sitemapArticles: 'sitemapArticles',
  },
  invalidateCache: jest.fn(),
}));

jest.mock('@/lib/notificationUtils', () => ({
  notifyArticleVersionSubscribers: jest.fn(),
  publishNotification: jest.fn(),
}));

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: jest.fn(), rpc: jest.fn() },
}));

const requirePermissionMock = jest.mocked(requirePermission);
const resolveArticleCharacterForWriteMock = jest.mocked(resolveArticleCharacterForWrite);
const invalidateCacheMock = jest.mocked(invalidateCache);
const notifyArticleVersionSubscribersMock = jest.mocked(notifyArticleVersionSubscribers);
const publishNotificationMock = jest.mocked(publishNotification);
const checkRateLimitMock = jest.mocked(checkRateLimit);
const rpcMock = jest.mocked(supabaseAdmin!.rpc);
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

const receiptQuery = { select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() };

const createRequest = (body: unknown) =>
  ({
    headers: new Headers({ 'Idempotency-Key': '10000000-0000-4000-8000-000000000001' }),
    json: async () => body,
  }) as Request;

describe('article submit route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    receiptQuery.select.mockReturnValue(receiptQuery);
    receiptQuery.eq.mockReturnValue(receiptQuery);
    receiptQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    jest.mocked(supabaseAdmin!.from).mockReturnValue(receiptQuery as never);
    checkRateLimitMock.mockResolvedValue({ allowed: true });
    requirePermissionMock.mockResolvedValue({
      userId: 'author-1',
      grants: [],
      supabase: {} as never,
    } as never);
    invalidateCacheMock.mockReset();
    notifyArticleVersionSubscribersMock.mockResolvedValue(undefined);
    publishNotificationMock.mockResolvedValue({
      created: true,
      suppressed: false,
      emailStatus: 'skipped',
    });
    resolveArticleCharacterForWriteMock.mockResolvedValue(null);
  });

  it('notifies subscribers when a submission stays pending', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          article_id: 'article-1',
          submitted_status: 'pending',
          submitted_version_id: 'version-1',
        },
      ],
      error: null,
    } as never);

    const response = await POST(
      createRequest({
        title: '测试文章',
        category: CATEGORY_ID,
        content: '内容',
      })
    );

    expect(response.status).toBe(200);
    expect(notifyArticleVersionSubscribersMock).toHaveBeenCalledWith({
      actorUserId: 'author-1',
      articleId: 'article-1',
      articleTitle: '测试文章',
      proposedCategoryId: CATEGORY_ID,
      versionId: 'version-1',
    });
    expect(publishNotificationMock).not.toHaveBeenCalled();
  });

  it('skips subscriber fan-out when the submission is auto-approved', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          article_id: 'article-1',
          submitted_status: 'approved',
          submitted_version_id: 'version-1',
        },
      ],
      error: null,
    } as never);

    const response = await POST(
      createRequest({
        title: '测试文章',
        category: CATEGORY_ID,
        content: '内容',
      })
    );

    expect(response.status).toBe(200);
    expect(notifyArticleVersionSubscribersMock).not.toHaveBeenCalled();
    expect(publishNotificationMock).toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON without calling the RPC', async () => {
    const response = await POST({
      json: async () => Promise.reject(new Error('bad json')),
    } as unknown as Request);

    expect(response.status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it.each(['pending', 'approved', 'rejected'])(
    'uses the committed %s outcome for refresh',
    async (status) => {
      rpcMock.mockResolvedValue({
        data: [
          {
            article_id: 'article-1',
            submitted_status: status,
            submitted_version_id: 'version-1',
          },
        ],
        error: null,
      } as never);
      const response = await POST(
        createRequest({ title: '文章', category: CATEGORY_ID, content: '内容' })
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        article_id: 'article-1',
        version_id: 'version-1',
        status,
      });
      expect(invalidateCacheMock).toHaveBeenCalledWith('article-previews', 'immediate');
      expect(invalidateCacheMock).toHaveBeenCalledTimes(status === 'approved' ? 5 : 2);
    }
  );

  it('returns success with a warning when invalidation fails after creation', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    rpcMock.mockResolvedValue({
      data: [
        {
          article_id: 'article-1',
          submitted_status: 'approved',
          submitted_version_id: 'version-1',
        },
      ],
      error: null,
    } as never);
    invalidateCacheMock.mockImplementationOnce(() => {
      throw new Error('cache unavailable');
    });
    const response = await POST(
      createRequest({ title: '文章', category: CATEGORY_ID, content: '内容' })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      article_id: 'article-1',
      warning: 'cache_refresh_failed',
    });
    expect(invalidateCacheMock).toHaveBeenCalledTimes(5);
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it('does not refresh or notify after a failed creation', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    rpcMock.mockResolvedValue({ data: null, error: { message: 'write failed' } } as never);
    expect(
      (await POST(createRequest({ title: '文章', category: CATEGORY_ID, content: '内容' }))).status
    ).toBe(500);
    expect(invalidateCacheMock).not.toHaveBeenCalled();
    expect(publishNotificationMock).not.toHaveBeenCalled();
    expect(notifyArticleVersionSubscribersMock).not.toHaveBeenCalled();
  });

  it('returns 429 before parsing or authorizing', async () => {
    checkRateLimitMock.mockResolvedValue({
      allowed: false,
      headers: { 'Retry-After': '60' },
      retryAfterSeconds: 60,
    });

    const response = await POST(createRequest(null));

    expect(response.status).toBe(429);
    expect(requirePermissionMock).not.toHaveBeenCalled();
  });
  it('replays the original receipt before revalidating category policy or notifying again', async () => {
    const body = { title: '文章', category: CATEGORY_ID, content: '内容' };
    rpcMock.mockResolvedValue({
      data: [
        {
          article_id: 'article-1',
          submitted_version_id: 'version-1',
          submitted_status: 'pending',
          replayed: false,
        },
      ],
      error: null,
    } as never);
    expect((await POST(createRequest(body))).status).toBe(200);
    const fingerprint = (rpcMock.mock.calls[0]![1] as { p_request_fingerprint: string })
      .p_request_fingerprint;
    receiptQuery.maybeSingle.mockResolvedValue({
      data: {
        actor_id: 'author-1',
        request_fingerprint: fingerprint,
        article_id: 'article-1',
        version_id: 'version-1',
        initial_status: 'pending',
      },
      error: null,
    });
    const retry = await POST(createRequest(body));
    expect(await retry.json()).toMatchObject({
      article_id: 'article-1',
      version_id: 'version-1',
      status: 'pending',
    });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(resolveArticleCharacterForWriteMock).toHaveBeenCalledTimes(1);
    expect(notifyArticleVersionSubscribersMock).toHaveBeenCalledTimes(1);
    expect((await POST(createRequest({ ...body, content: 'Changed' }))).status).toBe(409);
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it('requires a retry key before starting a write', async () => {
    const request = createRequest({ title: '文章', category: CATEGORY_ID, content: '内容' });
    request.headers.delete('Idempotency-Key');
    expect((await POST(request)).status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('stops when receipt lookup fails instead of risking a duplicate', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    receiptQuery.maybeSingle.mockResolvedValue({ data: null, error: { message: 'unavailable' } });
    expect(
      (await POST(createRequest({ title: '文章', category: CATEGORY_ID, content: '内容' }))).status
    ).toBe(500);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
