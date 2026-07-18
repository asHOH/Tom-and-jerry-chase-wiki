import { requirePermission } from '@/lib/auth/requirePermission';
import { PUBLISH_LIMITS } from '@/lib/gameData/publishLimits';
import {
  publishPreparedGameDataActions,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import { env } from '@/env';

const jsonResponse = (body: unknown, init?: { status?: number }) =>
  ({ status: init?.status ?? 200, json: async () => body }) as Response;

jest.mock('next/server', () => ({ NextResponse: { json: jest.fn(jsonResponse) } }));
jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_DISABLE_ARTICLES: '0',
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  },
}));
jest.mock('@/lib/auth/requirePermission', () => ({ requirePermission: jest.fn() }));
jest.mock('@/lib/gameData/trustedGameDataMutations', () => {
  class MockTrustedGameDataMutationError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  }
  return {
    publishPreparedGameDataActions: jest.fn(),
    TrustedGameDataMutationError: MockTrustedGameDataMutationError,
  };
});
jest.mock('@/lib/notificationUtils', () => ({ publishNotification: jest.fn() }));

const requirePermissionMock = jest.mocked(requirePermission);
const publishPreparedMock = jest.mocked(publishPreparedGameDataActions);
const mutableEnv = env as unknown as { NEXT_PUBLIC_DISABLE_ARTICLES?: string };

function createRequest(body: unknown, declaredLength?: number): Request {
  const bytes = new TextEncoder().encode(JSON.stringify(body));
  let delivered = false;
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-length' && declaredLength !== undefined
          ? String(declaredLength)
          : null,
    },
    body: {
      getReader: () => ({
        read: async () => {
          if (delivered) return { done: true as const, value: undefined };
          delivered = true;
          return { done: false as const, value: bytes };
        },
        cancel: async () => undefined,
      }),
    },
  } as unknown as Request;
}

const validBody = {
  entityType: ' items ',
  entries: [{ op: 'set', path: ' item.description ', newValue: 'new' }],
  message: '  message  ',
};

describe('publish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutableEnv.NEXT_PUBLIC_DISABLE_ARTICLES = '0';
    requirePermissionMock.mockResolvedValue({
      supabase: {} as never,
      userId: 'actor-1',
      grants: [{ permission: 'game_data_action.create' }],
    } as never);
    publishPreparedMock.mockResolvedValue([
      { id: 'action-1', is_public: false, status: 'pending' },
    ]);
  });

  it('rejects oversized input before authentication', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody, PUBLISH_LIMITS.requestBytes + 1));

    expect(response.status).toBe(413);
    expect(requirePermissionMock).not.toHaveBeenCalled();
    expect(publishPreparedMock).not.toHaveBeenCalled();
  });

  it('establishes the actor before strict decoding and persistence', async () => {
    requirePermissionMock.mockResolvedValueOnce({
      error: jsonResponse({ error: 'Unauthorized' }, { status: 401 }) as never,
    });
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({ entityType: 'items', entries: [{ op: 'set', path: '', unexpected: true }] })
    );

    expect(response.status).toBe(401);
    expect(publishPreparedMock).not.toHaveBeenCalled();
  });

  it('passes only strict canonical output to trusted persistence', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody));

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith('game_data_action.create');
    expect(publishPreparedMock).toHaveBeenCalledWith({
      actorId: 'actor-1',
      permission: 'game_data_action.create',
      grants: [{ permission: 'game_data_action.create' }],
      prepared: {
        actions: [
          {
            entityType: 'items',
            rows: [
              expect.objectContaining({
                canonicalEntry: { op: 'set', path: 'item.description', newValue: 'new' },
              }),
            ],
          },
        ],
        message: 'message',
      },
    });
  });

  it('rejects dependent top-level rows before persistence', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      createRequest({
        entityType: 'items',
        entries: [
          { op: 'set', path: 'item.description', newValue: 'first' },
          { op: 'set', path: 'item.description', newValue: 'second' },
        ],
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'dependent_rows' });
    expect(publishPreparedMock).not.toHaveBeenCalled();
  });

  it('maps replay candidate and epoch conflicts to 409', async () => {
    publishPreparedMock.mockRejectedValueOnce(
      new TrustedGameDataMutationError('candidate_conflict')
    );
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'candidate_conflict' });
  });
});
