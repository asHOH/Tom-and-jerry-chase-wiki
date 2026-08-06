import { resolveArticleCharacterForWrite } from '@/lib/articles/articleWriteRelations';
import { canAccess } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { requireNotBlocked } from '@/lib/blocks/server';
import { notifyArticleVersionSubscribers, publishNotification } from '@/lib/notificationUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

import { POST } from './route';

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(jsonResponse),
  },
}));

jest.mock('@/lib/articles/articleWriteRelations', () => ({
  ArticleWriteValidationError: class ArticleWriteValidationError extends Error {},
  resolveArticleCharacterForWrite: jest.fn(),
}));

jest.mock('@/lib/auth/permissions', () => ({
  canAccess: jest.fn(),
}));

jest.mock('@/lib/auth/requirePermission', () => ({
  loadPermissionGrants: jest.fn(),
}));

jest.mock('@/lib/blocks/server', () => ({
  getRequestIp: jest.fn(() => null),
  requireNotBlocked: jest.fn(),
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

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const canAccessMock = jest.mocked(canAccess);
const resolveArticleCharacterForWriteMock = jest.mocked(resolveArticleCharacterForWrite);
const loadPermissionGrantsMock = jest.mocked(loadPermissionGrants);
const requireNotBlockedMock = jest.mocked(requireNotBlocked);
const notifyArticleVersionSubscribersMock = jest.mocked(notifyArticleVersionSubscribers);
const publishNotificationMock = jest.mocked(publishNotification);
const checkRateLimitMock = jest.mocked(checkRateLimit);
const createClientMock = jest.mocked(createClient);
const adminFromMock = jest.mocked(supabaseAdmin.from);
const adminRpcMock = jest.mocked(supabaseAdmin.rpc);
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

const articleQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
};

const createRequest = (body: unknown) =>
  ({
    json: async () => body,
  }) as Request;

describe('article edit route', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    createClientMock.mockResolvedValue({
      auth: {
        getClaims: jest.fn().mockResolvedValue({ data: { claims: { sub: 'editor-1' } } }),
      },
    } as never);
    loadPermissionGrantsMock.mockResolvedValue([]);
    canAccessMock.mockReturnValue(true);
    checkRateLimitMock.mockResolvedValue({ allowed: true });
    requireNotBlockedMock.mockResolvedValue(null);
    resolveArticleCharacterForWriteMock.mockResolvedValue(null);
    notifyArticleVersionSubscribersMock.mockResolvedValue(undefined);
    publishNotificationMock.mockResolvedValue({
      created: true,
      suppressed: false,
      emailStatus: 'skipped',
    });

    articleQuery.select.mockReturnValue(articleQuery);
    articleQuery.eq.mockReturnValue(articleQuery);
    articleQuery.single.mockResolvedValue({
      data: { author_id: 'editor-1', category_id: CATEGORY_ID },
      error: null,
    });

    adminFromMock.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery as never;
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it('notifies subscribers when an edit stays pending', async () => {
    adminRpcMock.mockResolvedValue({
      data: [{ submitted_status: 'pending', submitted_version_id: 'version-1' }],
      error: null,
    } as never);

    const response = await POST(
      createRequest({
        title: '测试文章',
        category: CATEGORY_ID,
        content: '修改内容',
        commit_message: '补充说明',
      }),
      { params: Promise.resolve({ id: 'article-1' }) }
    );

    expect(response.status).toBe(200);
    expect(notifyArticleVersionSubscribersMock).toHaveBeenCalledWith({
      actorUserId: 'editor-1',
      articleId: 'article-1',
      articleTitle: '测试文章',
      proposedCategoryId: CATEGORY_ID,
      versionId: 'version-1',
    });
    expect(publishNotificationMock).not.toHaveBeenCalled();
  });

  it('does not fan out pending notifications for auto-approved edits', async () => {
    adminRpcMock.mockResolvedValue({
      data: [{ submitted_status: 'approved', submitted_version_id: 'version-1' }],
      error: null,
    } as never);

    const response = await POST(
      createRequest({
        title: '测试文章',
        category: CATEGORY_ID,
        content: '修改内容',
        commit_message: '补充说明',
      }),
      { params: Promise.resolve({ id: 'article-1' }) }
    );

    expect(response.status).toBe(200);
    expect(notifyArticleVersionSubscribersMock).not.toHaveBeenCalled();
    expect(publishNotificationMock).toHaveBeenCalled();
  });

  it('returns 400 for a non-string commit message', async () => {
    const response = await POST(
      createRequest({
        title: '测试文章',
        category: CATEGORY_ID,
        content: '修改内容',
        commit_message: { text: 'not a string' },
      }),
      { params: Promise.resolve({ id: 'article-1' }) }
    );

    expect(response.status).toBe(400);
    expect(adminRpcMock).not.toHaveBeenCalled();
  });

  it('returns 429 before authenticating', async () => {
    checkRateLimitMock.mockResolvedValue({
      allowed: false,
      headers: { 'Retry-After': '60' },
      retryAfterSeconds: 60,
    });

    const response = await POST(createRequest(null), {
      params: Promise.resolve({ id: 'article-1' }),
    });

    expect(response.status).toBe(429);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
