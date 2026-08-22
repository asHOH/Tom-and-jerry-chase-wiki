import { canAccess, canAccessAny } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/requirePermission';
import { publishNotification } from '@/lib/notificationUtils';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { getPublicUserSubmissionHref } from '@/lib/users/publicProfile';

import { POST } from './route';

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

jest.mock('next/server', () => ({ NextResponse: { json: jest.fn(jsonResponse) } }));
jest.mock('@/lib/auth/permissions', () => ({
  canAccess: jest.fn(),
  canAccessAny: jest.fn(),
}));
jest.mock('@/lib/auth/requirePermission', () => ({ requirePermission: jest.fn() }));
jest.mock('@/lib/notificationUtils', () => ({ publishNotification: jest.fn() }));
jest.mock('@/lib/supabase/adminClient', () => ({ requireSupabaseAdminClient: jest.fn() }));
jest.mock('@/lib/users/publicProfile', () => ({ getPublicUserSubmissionHref: jest.fn() }));

const VERSION_ID = '11111111-1111-4111-8111-111111111111';

const versionQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  maybeSingle: jest.fn(),
};
const reviewerQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  maybeSingle: jest.fn(),
};
const adminClient = { from: jest.fn() };

const requirePermissionMock = jest.mocked(requirePermission);
const canAccessMock = jest.mocked(canAccess);
const canAccessAnyMock = jest.mocked(canAccessAny);
const publishNotificationMock = jest.mocked(publishNotification);
const requireSupabaseAdminClientMock = jest.mocked(requireSupabaseAdminClient);
const getPublicUserSubmissionHrefMock = jest.mocked(getPublicUserSubmissionHref);

describe('contribution thank route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requirePermissionMock.mockResolvedValue({ userId: 'reviewer-id', grants: [] } as never);
    canAccessMock.mockReturnValue(true);
    canAccessAnyMock.mockReturnValue(true);
    publishNotificationMock.mockResolvedValue({ created: true } as never);
    getPublicUserSubmissionHrefMock.mockResolvedValue(null);

    versionQuery.select.mockReturnValue(versionQuery);
    versionQuery.eq.mockReturnValue(versionQuery);
    versionQuery.maybeSingle.mockResolvedValue({
      data: {
        article_id: 'article-id',
        editor_id: 'editor-id',
        proposed_category_id: 'category-id',
        proposed_title: '测试文章',
        status: 'approved',
        articles: { title: '测试文章', category_id: 'category-id' },
      },
      error: null,
    });

    reviewerQuery.select.mockReturnValue(reviewerQuery);
    reviewerQuery.eq.mockReturnValue(reviewerQuery);
    reviewerQuery.maybeSingle.mockResolvedValue({
      data: { nickname: '审核者' },
      error: null,
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'article_versions') return versionQuery;
      if (table === 'users_public_view') return reviewerQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    requireSupabaseAdminClientMock.mockReturnValue(adminClient as never);
  });

  it('loads the article through the submission foreign key before sending thanks', async () => {
    const response = await POST(
      { json: async () => ({ message: '感谢完善文章内容' }) } as Request,
      {
        params: Promise.resolve({ kind: 'article', contributionId: VERSION_ID }),
      }
    );

    expect(response.status).toBe(200);
    expect(versionQuery.select).toHaveBeenCalledWith(
      'article_id, editor_id, proposed_category_id, proposed_title, status, articles!article_versions_article_id_fkey(title, category_id)'
    );
    expect(publishNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: 'editor-id', kind: 'contribution_thanked' })
    );
  });
});
