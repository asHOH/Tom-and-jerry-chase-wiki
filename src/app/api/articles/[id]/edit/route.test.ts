import { canAccess } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { requireNotBlocked } from '@/lib/blocks/server';
import { notifyArticleVersionSubscribers, publishNotification } from '@/lib/notificationUtils';
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

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: jest.fn(), rpc: jest.fn() },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const canAccessMock = jest.mocked(canAccess);
const loadPermissionGrantsMock = jest.mocked(loadPermissionGrants);
const requireNotBlockedMock = jest.mocked(requireNotBlocked);
const notifyArticleVersionSubscribersMock = jest.mocked(notifyArticleVersionSubscribers);
const publishNotificationMock = jest.mocked(publishNotification);
const createClientMock = jest.mocked(createClient);
const adminFromMock = jest.mocked(supabaseAdmin.from);
const adminRpcMock = jest.mocked(supabaseAdmin.rpc);

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
    requireNotBlockedMock.mockResolvedValue(null);
    notifyArticleVersionSubscribersMock.mockResolvedValue(undefined);
    publishNotificationMock.mockResolvedValue({
      created: true,
      suppressed: false,
      emailStatus: 'skipped',
    });

    articleQuery.select.mockReturnValue(articleQuery);
    articleQuery.eq.mockReturnValue(articleQuery);
    articleQuery.single.mockResolvedValue({
      data: { author_id: 'editor-1', category_id: 'category-1' },
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
        category: 'category-1',
        content: '修改内容',
      }),
      { params: Promise.resolve({ id: 'article-1' }) }
    );

    expect(response.status).toBe(200);
    expect(notifyArticleVersionSubscribersMock).toHaveBeenCalledWith({
      actorUserId: 'editor-1',
      articleId: 'article-1',
      articleTitle: '测试文章',
      proposedCategoryId: 'category-1',
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
        category: 'category-1',
        content: '修改内容',
      }),
      { params: Promise.resolve({ id: 'article-1' }) }
    );

    expect(response.status).toBe(200);
    expect(notifyArticleVersionSubscribersMock).not.toHaveBeenCalled();
    expect(publishNotificationMock).toHaveBeenCalled();
  });
});
