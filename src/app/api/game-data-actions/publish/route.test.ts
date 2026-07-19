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

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: string;
      message: string;
      requestId: string;
    };
    expect(body).toEqual({
      error: 'dependent_rows',
      message: '这些修改存在顺序依赖，暂时无法一起提交。草稿已保留，请将请求编号提供给管理员。',
      requestId: expect.any(String) as string,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      'game_data_publish_rejected',
      expect.objectContaining({
        event: 'dependent_rows',
        requestId: body.requestId,
        route: '/api/game-data-actions/publish',
        entityType: 'items',
        dependencyGroups: [
          expect.objectContaining({
            rowIndexes: [0, 1],
            rows: [
              expect.objectContaining({
                rowIndex: 0,
                actions: [{ op: 'set', path: 'item.description' }],
              }),
              expect.objectContaining({
                rowIndex: 1,
                actions: [{ op: 'set', path: 'item.description' }],
              }),
            ],
          }),
        ],
      })
    );
    expect(publishPreparedMock).not.toHaveBeenCalled();
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
    expect(warnSpy).toHaveBeenCalledWith('game_data_publish_rejected', {
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
