import { requireRole } from '@/lib/auth/requireRole';
import { publishGameDataActions } from '@/lib/gameData/publishGameDataActions';
import { env } from '@/env';

const jsonResponse = (body: unknown, init?: { status?: number }) =>
  ({
    status: init?.status ?? 200,
    json: async () => body,
  }) as Response;

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(jsonResponse),
  },
}));

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_DISABLE_ARTICLES: '0',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

jest.mock('@/lib/auth/requireRole', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/gameData/publishGameDataActions', () => ({
  publishGameDataActions: jest.fn(),
}));

const requireRoleMock = jest.mocked(requireRole);
const publishGameDataActionsMock = jest.mocked(publishGameDataActions);
const mutableEnv = env as unknown as {
  NEXT_PUBLIC_DISABLE_ARTICLES?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

const createRequest = (body: unknown) =>
  ({
    json: async () => body,
  }) as Request;

describe('publish-relations route', () => {
  beforeEach(() => {
    mutableEnv.NEXT_PUBLIC_DISABLE_ARTICLES = '0';
    mutableEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    requireRoleMock.mockResolvedValue({ supabase: { rpc: jest.fn() } as never });
    publishGameDataActionsMock.mockResolvedValue([
      { id: 'action-1', is_public: false, status: 'pending' },
    ]);
  });

  it('returns 401 for unauthenticated requests', async () => {
    requireRoleMock.mockResolvedValueOnce({
      error: jsonResponse({ error: 'Unauthorized' }, { status: 401 }) as never,
    });
    const { POST } = await import('./route');

    const response = await POST(createRequest({ entries: [] }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 for unauthorized roles', async () => {
    requireRoleMock.mockResolvedValueOnce({
      error: jsonResponse({ error: 'Forbidden' }, { status: 403 }) as never,
    });
    const { POST } = await import('./route');

    const response = await POST(createRequest({ entries: [] }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns the shared disabled response when Supabase is disabled', async () => {
    mutableEnv.NEXT_PUBLIC_DISABLE_ARTICLES = '1';
    const { POST } = await import('./route');

    const response = await POST(createRequest({ entries: [] }));

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({ error: 'Supabase is disabled' });
    expect(requireRoleMock).not.toHaveBeenCalled();
  });

  it('rejects non-relation character paths', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({
        entries: [{ op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' }],
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Only relation actions are allowed' });
    expect(publishGameDataActionsMock).not.toHaveBeenCalled();
  });

  it('publishes valid relation actions as a characters action item', async () => {
    const { POST } = await import('./route');
    const entries = [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
    ];

    const response = await POST(createRequest({ entries, message: '  更新关系  ' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      result: [{ id: 'action-1', is_public: false, status: 'pending' }],
    });
    expect(requireRoleMock).toHaveBeenCalledWith(['Contributor', 'Reviewer', 'Coordinator']);
    expect(publishGameDataActionsMock).toHaveBeenCalledWith(
      { rpc: expect.any(Function) },
      [{ entityType: 'characters', entries }],
      '更新关系'
    );
  });
});
