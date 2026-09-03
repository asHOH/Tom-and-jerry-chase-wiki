import { requirePermissionOrAnonymous } from '@/lib/auth/requirePermission';
import { PUBLISH_LIMITS } from '@/lib/gameData/publishLimits';
import {
  publishPreparedGameDataActions,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import {
  notifyPendingGameDataActionSubscribers,
  publishNotification,
} from '@/lib/notificationUtils';
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
jest.mock('@/lib/auth/requirePermission', () => ({
  requirePermissionOrAnonymous: jest.fn(),
}));
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PENDING_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS: 12 * 60 * 60,
  PENDING_GAME_DATA_ACTIONS_CACHE_TAG: 'pending-game-data-actions',
}));
jest.mock('@/lib/serverCache', () => ({
  cached: (_key: unknown, reader: () => Promise<unknown>) => reader(),
}));
jest.mock('@/lib/gameData/trustedGameDataMutations', () => {
  class MockTrustedGameDataMutationError extends Error {
    constructor(
      readonly code: string,
      cause?: unknown
    ) {
      super(code, { cause });
    }
  }
  return {
    publishPreparedGameDataActions: jest.fn(),
    TrustedGameDataMutationError: MockTrustedGameDataMutationError,
  };
});
jest.mock('@/lib/notificationUtils', () => ({
  notifyPendingGameDataActionSubscribers: jest.fn(),
  publishNotification: jest.fn(),
}));

const requirePermissionMock = jest.mocked(requirePermissionOrAnonymous);
const publishPreparedMock = jest.mocked(publishPreparedGameDataActions);
const notifyPendingGameDataActionSubscribersMock = jest.mocked(
  notifyPendingGameDataActionSubscribers
);
const publishNotificationMock = jest.mocked(publishNotification);
const mutableEnv = env as unknown as { NEXT_PUBLIC_DISABLE_ARTICLES?: string };

function createRequest(
  body: unknown,
  declaredLength?: number,
  operationId?: string | null
): Request {
  const bytes = new TextEncoder().encode(JSON.stringify(body));
  let delivered = false;
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-length' && declaredLength !== undefined
          ? String(declaredLength)
          : name.toLowerCase() === 'idempotency-key'
            ? (operationId ?? null)
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
    notifyPendingGameDataActionSubscribersMock.mockResolvedValue(undefined);
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

  it('rejects malformed idempotency keys at the request boundary', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody, undefined, 'not-a-uuid'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_idempotency_key' });
    expect(requirePermissionMock).not.toHaveBeenCalled();
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

  it('publishes anonymous submissions as pending actions', async () => {
    requirePermissionMock.mockResolvedValueOnce({
      supabase: {} as never,
      userId: null,
      grants: [],
    });
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody));

    expect(response.status).toBe(200);
    expect(publishPreparedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: null,
        permission: 'game_data_action.create',
        grants: [],
      })
    );
  });

  it('passes only strict canonical output to trusted persistence', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody));

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith(
      'game_data_action.create',
      undefined,
      'all',
      expect.objectContaining({ blockAction: 'edit', request: expect.anything() })
    );
    expect(publishPreparedMock).toHaveBeenCalledWith({
      actorId: 'actor-1',
      clientIp: null,
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

  it('passes submitMode through to trusted persistence when public pending is requested', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({ ...validBody, submitMode: 'force_public_pending' })
    );

    expect(response.status).toBe(200);
    expect(publishPreparedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        submitMode: 'force_public_pending',
      })
    );
  });

  it('passes a valid idempotency key through to trusted persistence', async () => {
    const { POST } = await import('./route');
    const operationId = 'a3bb189e-8c21-4b8d-9a4f-5e24b7c29a10';

    const response = await POST(createRequest(validBody, undefined, operationId));

    expect(response.status).toBe(200);
    expect(publishPreparedMock).toHaveBeenCalledWith(expect.objectContaining({ operationId }));
  });

  it('rejects invalid submitMode values as invalid_shape', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest({ ...validBody, submitMode: 'unexpected-mode' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: 'invalid_shape' })
    );
    expect(publishPreparedMock).not.toHaveBeenCalled();
  });

  it('notifies moderators only about newly private pending actions', async () => {
    publishPreparedMock.mockResolvedValueOnce([
      { id: 'pending-private', is_public: false, status: 'pending' },
      { id: 'pending-public', is_public: true, status: 'pending' },
      { id: 'approved-public', is_public: true, status: 'approved' },
    ]);
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody));

    expect(response.status).toBe(200);
    expect(notifyPendingGameDataActionSubscribersMock).toHaveBeenCalledWith({
      actorUserId: 'actor-1',
      actionIds: ['pending-private'],
    });
  });

  it('does not emit automatic public notifications when force_pending keeps submissions private', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest({ ...validBody, submitMode: 'force_pending' }));

    expect(response.status).toBe(200);
    expect(notifyPendingGameDataActionSubscribersMock).toHaveBeenCalledWith({
      actorUserId: 'actor-1',
      actionIds: ['action-1'],
    });
    expect(publishNotificationMock).not.toHaveBeenCalled();
  });

  it('treats force_public_pending submissions as automatic public results, not private pending ones', async () => {
    publishPreparedMock.mockResolvedValueOnce([
      { id: 'public-pending-1', is_public: true, status: 'pending' },
    ]);
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({
        entityType: 'items',
        entries: [
          { op: 'set', path: 'item.description', newValue: 'first' },
          { op: 'set', path: 'item.description', newValue: 'second' },
        ],
        submitMode: 'force_public_pending',
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      result: [{ id: 'public-pending-1', is_public: true, status: 'pending' }],
    });
    expect(publishPreparedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        submitMode: 'force_public_pending',
        prepared: expect.objectContaining({
          actions: [
            expect.objectContaining({
              rows: [
                expect.objectContaining({
                  canonicalEntry: [
                    { op: 'set', path: 'item.description', newValue: 'first' },
                    { op: 'set', path: 'item.description', newValue: 'second' },
                  ],
                }),
              ],
            }),
          ],
        }),
      })
    );
    expect(notifyPendingGameDataActionSubscribersMock).not.toHaveBeenCalled();
    expect(publishNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'game_data_action_approved',
        title: '游戏数据改动已自动公开',
        body: '您提交的 1 条道具「item」改动已自动公开，后续仍可由有权限的用户复核或撤销。',
        sourceIds: ['public-pending-1'],
      })
    );
  });

  it('passes dependent top-level rows to persistence as one ordered canonical row', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
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

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      result: [{ id: 'action-1', is_public: false, status: 'pending' }],
    });
    expect(publishPreparedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prepared: expect.objectContaining({
          actions: [
            expect.objectContaining({
              entityType: 'items',
              rows: [
                expect.objectContaining({
                  canonicalEntry: [
                    { op: 'set', path: 'item.description', newValue: 'first' },
                    { op: 'set', path: 'item.description', newValue: 'second' },
                  ],
                }),
              ],
            }),
          ],
        }),
      })
    );
    expect(notifyPendingGameDataActionSubscribersMock).toHaveBeenCalledWith({
      actorUserId: 'actor-1',
      actionIds: ['action-1'],
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logs bounded candidate diagnostics and returns guidance with a request ID', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const replayCause = {
      detail: {
        code: 'missing_path',
        stage: 'apply',
        operation: 'set',
        path: 'item.description',
        rowId: 'proposed:items:0',
        actionIndex: 0,
        targetIndex: 0,
        rootKey: 'item',
        segmentIndex: 1,
        segment: 's'.repeat(300),
        message: 'SECRET_REPLAY_MESSAGE',
        cause: { value: 'SECRET_ACTION_VALUE' },
      },
    };
    publishPreparedMock.mockRejectedValueOnce(
      new TrustedGameDataMutationError('candidate_conflict', replayCause)
    );
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody));

    expect(response.status).toBe(409);
    const body = (await response.json()) as {
      error: string;
      message: string;
      requestId: string;
    };
    expect(body).toEqual({
      error: 'candidate_conflict',
      message: '发布前的数据兼容性检查未通过。草稿已保留，请将请求编号提供给管理员。',
      requestId: expect.any(String) as string,
    });
    expect(warnSpy).toHaveBeenCalledWith('game_data_publish_rejected', expect.any(String));
    const logged = JSON.parse(warnSpy.mock.calls[0]?.[1] as string) as Record<string, unknown>;
    expect(logged).toEqual({
      event: 'candidate_conflict',
      requestId: body.requestId,
      route: '/api/game-data-actions/publish',
      replayError: {
        code: 'missing_path',
        stage: 'apply',
        operation: 'set',
        path: 'item.description',
        rowId: 'proposed:items:0',
        actionIndex: 0,
        targetIndex: 0,
        rootKey: 'item',
        segmentIndex: 1,
        segment: 's'.repeat(256),
      },
    });
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('SECRET_REPLAY_MESSAGE');
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('SECRET_ACTION_VALUE');
    warnSpy.mockRestore();
  });

  it('keeps replay epoch conflicts on their stable 409 response', async () => {
    publishPreparedMock.mockRejectedValueOnce(
      new TrustedGameDataMutationError('replay_epoch_conflict')
    );
    const { POST } = await import('./route');

    const response = await POST(createRequest(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'replay_epoch_conflict' });
  });
});
