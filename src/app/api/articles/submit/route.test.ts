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
  supabaseAdmin: { rpc: jest.fn() },
}));

const requirePermissionMock = jest.mocked(requirePermission);
const resolveArticleCharacterForWriteMock = jest.mocked(resolveArticleCharacterForWrite);
const invalidateCacheMock = jest.mocked(invalidateCache);
const notifyArticleVersionSubscribersMock = jest.mocked(notifyArticleVersionSubscribers);
const publishNotificationMock = jest.mocked(publishNotification);
const checkRateLimitMock = jest.mocked(checkRateLimit);
const rpcMock = jest.mocked(supabaseAdmin.rpc);
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

const createRequest = (body: unknown) =>
  ({
    json: async () => body,
  }) as Request;

describe('article submit route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimitMock.mockResolvedValue({ allowed: true });
    requirePermissionMock.mockResolvedValue({
      userId: 'author-1',
      grants: [],
      supabase: {} as never,
    } as never);
    invalidateCacheMock.mockResolvedValue(undefined as never);
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
});
