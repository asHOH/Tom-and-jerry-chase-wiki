import { createHash } from 'node:crypto';
import { revalidateTag } from 'next/cache';

import { resolveArticleCharacterForWrite } from '@/lib/articles/articleWriteRelations';
import { canAccess } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { requireNotBlocked } from '@/lib/blocks/server';
import { notifyArticleVersionSubscribers, publishNotification } from '@/lib/notificationUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { articleEditSchema } from '@/lib/validation/schemas';

import { POST } from './route';

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

jest.mock('@/lib/users/publicProfile', () => ({ getPublicUserSubmissionHref: jest.fn() }));

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
const adminFromMock = jest.mocked(supabaseAdmin!.from);
const adminRpcMock = jest.mocked(supabaseAdmin!.rpc);
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

const articleQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  maybeSingle: jest.fn(),
};

const receiptQuery = { select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() };

const createRequest = (body: unknown) =>
  ({
    headers: new Headers({ 'Idempotency-Key': '10000000-0000-4000-8000-000000000001' }),
    json: async () =>
      body && typeof body === 'object'
        ? {
            base_version_id: null,
            pending_version_id: null,
            source_pending_version_id: null,
            ...body,
          }
        : body,
  }) as Request;

describe('article edit route', () => {
  it('recovers a completed old-format request before requiring version fields', async () => {
    const body = {
      title: 'Old client',
      category: CATEGORY_ID,
      content: '<p>Saved</p>',
      commit_message: 'Edit',
    };
    const request = createRequest(body);
    request.json = async () => body;
    const params = { params: Promise.resolve({ id: 'article-1' }) };
    const absent = await POST(request, params);
    expect(absent.status).toBe(409);
    expect(await absent.json()).toMatchObject({ code: 'article_refresh_required' });
    receiptQuery.maybeSingle.mockResolvedValue({
      data: {
        actor_id: 'editor-1',
        request_fingerprint: createHash('sha256')
          .update(
            JSON.stringify({
              actorId: 'editor-1',
              articleId: 'article-1',
              draft: articleEditSchema.parse(body),
            })
          )
          .digest('hex'),
        article_id: 'article-1',
        version_id: 'version-old',
        initial_status: 'pending',
      },
      error: null,
    });
    expect(await (await POST(request, params)).json()).toMatchObject({
      version_id: 'version-old',
      status: 'pending',
    });
    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(notifyArticleVersionSubscribersMock).not.toHaveBeenCalled();
  });

  it('returns a recoverable conflict without invalidating or notifying a rejected write', async () => {
    adminRpcMock.mockResolvedValue({
      data: null,
      error: { message: 'article_edit_conflict' },
    } as never);
    const response = await POST(
      createRequest({
        title: 'Title',
        category: CATEGORY_ID,
        content: '<p>Draft</p>',
        commit_message: 'Edit',
      }),
      { params: Promise.resolve({ id: 'article-1' }) }
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'article_edit_conflict' });
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(notifyArticleVersionSubscribersMock).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    receiptQuery.select.mockReturnValue(receiptQuery);
    receiptQuery.eq.mockReturnValue(receiptQuery);
    receiptQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

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
    articleQuery.maybeSingle.mockResolvedValue({
      data: { author_id: 'editor-1', category_id: CATEGORY_ID },
      error: null,
    });

    adminFromMock.mockImplementation((table: string) => {
      if (table === 'article_submission_requests') return receiptQuery as never;
      if (table === 'articles') return articleQuery as never;
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it.each([
    [{ message: 'database unavailable' }, 500, 'Internal server error'],
    [null, 404, 'Article not found'],
  ])('stops before mutation when article lookup returns %j', async (error, status, message) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    articleQuery.maybeSingle.mockResolvedValue({ data: null, error });
    const response = await POST(
      createRequest({
        title: '文章',
        category: CATEGORY_ID,
        content: '内容',
        commit_message: '更新',
      }),
      { params: Promise.resolve({ id: 'article-1' }) }
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: message });
    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(notifyArticleVersionSubscribersMock).not.toHaveBeenCalled();
    expect(publishNotificationMock).not.toHaveBeenCalled();
  });

  it('notifies subscribers when an edit stays pending', async () => {
    adminRpcMock.mockResolvedValue({
      data: [
        { article_id: 'article-1', submitted_status: 'pending', submitted_version_id: 'version-1' },
      ],
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

  it.each(['approved', 'pending', 'rejected'])(
    'preserves success after refresh failure for %s edits',
    async (status) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const data = [{ submitted_status: status, submitted_version_id: 'version-1' }];
      adminRpcMock.mockResolvedValue({ data, error: null } as never);
      jest.mocked(revalidateTag).mockImplementationOnce(() => {
        throw new Error('cache failed');
      });
      const response = await POST(
        createRequest({
          title: '文章',
          category: CATEGORY_ID,
          content: '内容',
          commit_message: '补充说明',
        }),
        { params: Promise.resolve({ id: 'article-1' }) }
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        data,
        article_id: 'article-1',
        version_id: 'version-1',
        status,
        warning: 'cache_refresh_failed',
      });
      expect(revalidateTag).toHaveBeenCalledTimes(status === 'approved' ? 5 : 2);
      expect(revalidateTag).toHaveBeenLastCalledWith('article-previews', { expire: 0 });
      expect(adminRpcMock).toHaveBeenCalledTimes(1);
    }
  );

  it('keeps a missing receipt retryable without pretending a result is known', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    adminRpcMock.mockResolvedValue({ data: [], error: null } as never);
    const response = await POST(
      createRequest({
        title: '文章',
        category: CATEGORY_ID,
        content: '内容',
        commit_message: '更新',
      }),
      { params: Promise.resolve({ id: 'article-1' }) }
    );
    expect(response.status).toBe(500);
    expect(notifyArticleVersionSubscribersMock).not.toHaveBeenCalled();
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
