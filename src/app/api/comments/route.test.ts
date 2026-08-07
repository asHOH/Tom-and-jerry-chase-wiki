import { requirePermission } from '@/lib/auth/requirePermission';
import { shouldAllowComment } from '@/lib/comments/moderation';
import { notifyDiscussionCommentSubscribers, publishNotification } from '@/lib/notificationUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';

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
jest.mock('@/lib/auth/requirePermission', () => ({ requirePermission: jest.fn() }));
jest.mock('@/lib/blocks/server', () => ({ getRequestIp: jest.fn(() => '127.0.0.1') }));
jest.mock('@/lib/comments/moderation', () => ({ shouldAllowComment: jest.fn() }));
jest.mock('@/lib/notificationUtils', () => ({
  notifyDiscussionCommentSubscribers: jest.fn(),
  publishNotification: jest.fn(),
}));
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }));
jest.mock('@/lib/supabase/config', () => ({ hasSupabasePublicConfig: jest.fn(() => true) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

const requirePermissionMock = jest.mocked(requirePermission);
const shouldAllowCommentMock = jest.mocked(shouldAllowComment);
const notifyDiscussionCommentSubscribersMock = jest.mocked(notifyDiscussionCommentSubscribers);
const publishNotificationMock = jest.mocked(publishNotification);
const checkRateLimitMock = jest.mocked(checkRateLimit);
const adminFromMock = jest.mocked(supabaseAdmin!.from);
const adminRpcMock = jest.mocked(supabaseAdmin!.rpc);
const hasSupabasePublicConfigMock = jest.mocked(hasSupabasePublicConfig);

const commentId = '00000000-0000-4000-8000-000000000001';
const commentRow = {
  id: commentId,
  parent_id: null,
  author_id: 'commenter-1',
  content: '这是一条新的评论',
  created_at: '2026-07-25T10:00:00.000Z',
  title: null,
  status: 'visible',
};

const createRequest = (body: unknown) =>
  ({
    json: async () => body,
  }) as Request;

describe('comments route', () => {
  const commentsSelectQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };
  const nicknamesQuery = {
    select: jest.fn(),
    in: jest.fn(),
  };
  const articleQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
  };
  const commentUpdateQuery = {
    update: jest.fn(),
    eq: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    commentsSelectQuery.select.mockReturnValue(commentsSelectQuery);
    commentsSelectQuery.eq.mockReturnValue(commentsSelectQuery);
    commentsSelectQuery.single.mockResolvedValue({
      data: commentRow,
      error: null,
    });

    nicknamesQuery.select.mockReturnValue(nicknamesQuery);
    nicknamesQuery.in.mockResolvedValue({
      data: [{ id: 'commenter-1', nickname: '评论者' }],
      error: null,
    });

    articleQuery.select.mockReturnValue(articleQuery);
    articleQuery.eq.mockReturnValue(articleQuery);
    articleQuery.maybeSingle.mockResolvedValue({
      data: { author_id: 'author-1', title: '测试文章' },
      error: null,
    });

    commentUpdateQuery.update.mockReturnValue(commentUpdateQuery);
    commentUpdateQuery.eq.mockResolvedValue({ error: null });

    hasSupabasePublicConfigMock.mockReturnValue(true);
    checkRateLimitMock.mockResolvedValue({ allowed: true });
    shouldAllowCommentMock.mockResolvedValue(true);
    publishNotificationMock.mockResolvedValue({
      created: true,
      suppressed: false,
      emailStatus: 'skipped',
    });
    notifyDiscussionCommentSubscribersMock.mockResolvedValue(undefined);
    adminRpcMock.mockResolvedValue({ data: commentId, error: null } as never);
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'users_public_view') return nicknamesQuery as never;
      if (table === 'articles') return articleQuery as never;
      if (table === 'comments') return commentUpdateQuery as never;
      throw new Error(`Unexpected table: ${table}`);
    });
    requirePermissionMock.mockResolvedValue({
      userId: 'commenter-1',
      supabase: {
        from: jest.fn((table: string) => {
          if (table === 'comments') return commentsSelectQuery as never;
          throw new Error(`Unexpected table: ${table}`);
        }),
      },
    } as never);
  });

  it('notifies the article author about a visible new article comment', async () => {
    const response = await POST(
      createRequest({
        scope: 'articles',
        targetId: 'article-1',
        content: '这是一条新的评论',
      })
    );

    expect(response.status).toBe(200);
    expect(publishNotificationMock).toHaveBeenCalledWith({
      recipientUserId: 'author-1',
      kind: 'article_comment_created',
      decisionOrigin: 'automatic',
      title: '《测试文章》收到新评论',
      body: '评论者发表了评论：\n这是一条新的评论',
      href: '/articles/article-1/#comments',
      sourceIds: [commentId],
      dedupeKey: `article-comment:${commentId}:author:author-1`,
    });
  });

  it('skips notifications when the article author comments on their own article', async () => {
    articleQuery.maybeSingle.mockResolvedValueOnce({
      data: { author_id: 'commenter-1', title: '测试文章' },
      error: null,
    });

    const response = await POST(
      createRequest({
        scope: 'articles',
        targetId: 'article-1',
        content: '作者自己的评论',
      })
    );

    expect(response.status).toBe(200);
    expect(publishNotificationMock).not.toHaveBeenCalled();
    expect(notifyDiscussionCommentSubscribersMock).not.toHaveBeenCalled();
  });

  it('notifies opted-in users about non-article discussion comments', async () => {
    commentsSelectQuery.single.mockResolvedValueOnce({
      data: { ...commentRow, title: '测试话题' },
      error: null,
    });

    const response = await POST(
      createRequest({
        scope: 'characters',
        targetId: 'tom',
        content: '这是一条新的评论',
        title: '测试话题',
      })
    );

    expect(response.status).toBe(200);
    expect(notifyDiscussionCommentSubscribersMock).toHaveBeenCalledWith({
      actorUserId: 'commenter-1',
      commentId,
      scope: 'characters',
      targetId: 'tom',
      body: '评论者发布了新话题：\n这是一条新的评论',
    });
    expect(publishNotificationMock).not.toHaveBeenCalled();
  });

  it('does not notify when the new comment is auto-hidden', async () => {
    shouldAllowCommentMock.mockResolvedValueOnce(false);
    commentsSelectQuery.single.mockResolvedValueOnce({
      data: { ...commentRow, status: 'hidden' },
      error: null,
    });

    const response = await POST(
      createRequest({
        scope: 'articles',
        targetId: 'article-1',
        content: '这条评论会被隐藏',
      })
    );

    expect(response.status).toBe(200);
    expect(commentUpdateQuery.update).toHaveBeenCalledWith({ status: 'hidden' });
    expect(commentUpdateQuery.eq).toHaveBeenCalledWith('id', commentId);
    expect(publishNotificationMock).not.toHaveBeenCalled();
    expect(notifyDiscussionCommentSubscribersMock).not.toHaveBeenCalled();
  });
});
