import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { publishNotification } from '@/lib/notificationUtils';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';

import { POST } from './route';

jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));
jest.mock('@/lib/auth/requirePermission', () => ({ requirePermission: jest.fn() }));
jest.mock('@/lib/blocks/server', () => ({ getRequestIp: () => null }));
jest.mock('@/lib/supabase/adminClient', () => ({ requireSupabaseAdminClient: jest.fn() }));
jest.mock('@/lib/notificationUtils', () => ({ publishNotification: jest.fn() }));
jest.mock('@/lib/users/publicProfile', () => ({
  getPublicUserSubmissionHref: jest.fn().mockResolvedValue('/users/editor/submissions/'),
}));

const rpc = jest.fn();
const targetLookup = jest.fn();
const notificationLookup = jest.fn();
const targetQuery = { select: jest.fn(), eq: jest.fn(), maybeSingle: targetLookup };
const notificationQuery = { select: jest.fn(), eq: jest.fn(), single: notificationLookup };
const moderate = (action = 'approve') =>
  POST(
    {
      url: `https://tjwiki.test/api/moderation/v?action=${action}`,
      json: async () => ({ feedback: '审核反馈' }),
    } as NextRequest,
    { params: Promise.resolve({ versionId: 'v' }) }
  );

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  targetQuery.select.mockReturnValue(targetQuery);
  targetQuery.eq.mockReturnValue(targetQuery);
  notificationQuery.select.mockReturnValue(notificationQuery);
  notificationQuery.eq.mockReturnValue(notificationQuery);
  targetLookup.mockResolvedValue({ data: { article_id: 'a' }, error: null });
  notificationLookup.mockResolvedValue({
    data: { article_id: 'a', editor_id: 'editor', proposed_title: '文章' },
    error: null,
  });
  rpc.mockResolvedValue({ error: null });
  jest.mocked(requirePermission).mockResolvedValue({
    userId: 'reviewer',
    supabase: { from: () => notificationQuery },
    grants: [],
  } as never);
  jest.mocked(requireSupabaseAdminClient).mockReturnValue({
    from: () => targetQuery,
    rpc,
  } as never);
  jest.mocked(publishNotification).mockResolvedValue({
    created: true,
    suppressed: false,
    emailStatus: 'skipped',
  });
});

it.each([
  [{ data: null, error: { message: 'lookup unavailable' } }, 500],
  [{ data: null, error: null }, 404],
])('does not mutate if the required target cannot be resolved', async (lookup, status) => {
  targetLookup.mockResolvedValue(lookup);
  const response = await moderate();
  expect(response.status).toBe(status);
  expect(rpc).not.toHaveBeenCalled();
  expect(revalidateTag).not.toHaveBeenCalled();
});

it('keeps the permission guard before lookup and mutation', async () => {
  jest.mocked(requirePermission).mockResolvedValue({ error: { status: 403 } } as never);
  expect((await moderate()).status).toBe(403);
  expect(targetLookup).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});

it('preserves RPC state-transition failures without publishing or invalidating', async () => {
  rpc.mockResolvedValue({ error: { message: 'Article version not in pending status' } });
  expect((await moderate()).status).toBe(409);
  expect(revalidateTag).not.toHaveBeenCalled();
  expect(publishNotification).not.toHaveBeenCalled();
});

it.each(['approve', 'reject', 'revoke'])(
  'refreshes after %s even if notification lookup fails',
  async (action) => {
    notificationLookup.mockImplementationOnce(() => {
      expect(revalidateTag).toHaveBeenCalledWith('article-previews', { expire: 0 });
      throw new Error('optional lookup failed');
    });
    const response = await moderate(action);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ action, version_id: 'v' });
    expect(targetLookup.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[0]!);
    expect(revalidateTag).toHaveBeenCalledWith(
      'articles',
      action === 'revoke' ? { expire: 0 } : 'max'
    );
    if (action !== 'reject') expect(revalidateTag).toHaveBeenCalledWith('article:a', { expire: 0 });
  }
);

it('returns success and a warning while attempting every tag after a cache failure', async () => {
  jest.mocked(revalidateTag).mockImplementationOnce(() => {
    throw new Error('cache failed');
  });
  const response = await moderate();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ warning: 'cache_refresh_failed' });
  expect(revalidateTag).toHaveBeenCalledTimes(5);
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(publishNotification).toHaveBeenCalled();
});

it('retains successful moderation when notification delivery fails', async () => {
  jest.mocked(publishNotification).mockRejectedValueOnce(new Error('notification failed'));
  const response = await moderate();
  expect(response.status).toBe(200);
  expect(await response.json()).not.toHaveProperty('warning');
  expect(revalidateTag).toHaveBeenCalledTimes(5);
});
