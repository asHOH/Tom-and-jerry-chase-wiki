import { requirePermission } from '@/lib/auth/requirePermission';
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

const requirePermissionMock = jest.mocked(requirePermission);
const publishPreparedMock = jest.mocked(publishPreparedGameDataActions);
const mutableEnv = env as unknown as {
  NEXT_PUBLIC_DISABLE_ARTICLES?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

function createRequest(body: unknown): Request {
  const bytes = new TextEncoder().encode(JSON.stringify(body));
  let delivered = false;
  return {
    headers: { get: () => null },
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

const validEntries = [
  { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
];

describe('publish-relations route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutableEnv.NEXT_PUBLIC_DISABLE_ARTICLES = '0';
    mutableEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
    requirePermissionMock.mockResolvedValue({
      supabase: {} as never,
      userId: 'test-user',
      grants: [{ permission: 'game_data_action.publish_relations' }],
    } as never);
    publishPreparedMock.mockResolvedValue([
      { id: 'action-1', is_public: false, status: 'pending' },
    ]);
  });

  it('authenticates before strict relation decoding or persistence', async () => {
    requirePermissionMock.mockResolvedValueOnce({
      error: jsonResponse({ error: 'Unauthorized' }, { status: 401 }) as never,
    });
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({ entries: [{ op: 'set', path: '', unexpected: true }] })
    );

    expect(response.status).toBe(401);
    expect(publishPreparedMock).not.toHaveBeenCalled();
  });

  it('keeps the shared disabled response', async () => {
    mutableEnv.NEXT_PUBLIC_DISABLE_ARTICLES = '1';
    const { POST } = await import('./route');

    const response = await POST(createRequest({ entries: [] }));

    expect(response.status).toBe(501);
    expect(requirePermissionMock).not.toHaveBeenCalled();
  });

  it('rejects non-relation character paths before persistence', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({
        entries: [{ op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' }],
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Only relation actions are allowed' });
    expect(publishPreparedMock).not.toHaveBeenCalled();
  });

  it('uses the fixed relations permission and canonical prepared rows', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest({ entries: validEntries, message: '  更新关系  ' }));

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith(
      'game_data_action.publish_relations',
      undefined,
      'all',
      expect.objectContaining({ blockAction: 'edit', request: expect.anything() })
    );
    expect(publishPreparedMock).toHaveBeenCalledWith({
      actorId: 'test-user',
      clientIp: null,
      permission: 'game_data_action.publish_relations',
      grants: [{ permission: 'game_data_action.publish_relations' }],
      prepared: expect.objectContaining({
        message: '更新关系',
        actions: [
          expect.objectContaining({
            entityType: 'characters',
            rows: [expect.objectContaining({ canonicalEntry: validEntries[0] })],
          }),
        ],
      }),
    });
  });

  it('passes submitMode through to trusted persistence when requested', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({
        entries: validEntries,
        message: '更新关系',
        submitMode: 'force_public_pending',
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      result: [{ id: 'action-1', is_public: false, status: 'pending' }],
    });
    expect(publishPreparedMock).toHaveBeenCalledWith(
      expect.objectContaining({ submitMode: 'force_public_pending' })
    );
  });

  it('rejects invalid submitMode values as invalid_shape', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({ entries: validEntries, submitMode: 'unexpected-mode' })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: 'invalid_shape' })
    );
    expect(publishPreparedMock).not.toHaveBeenCalled();
  });

  it('passes dependent relation rows to persistence as one ordered canonical row', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { POST } = await import('./route');

    const response = await POST(
      createRequest({
        entries: [
          { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
          {
            op: 'set',
            path: '杰瑞.counters',
            oldValue: [{ id: '汤姆' }],
            newValue: [{ id: '布奇' }],
          },
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
              entityType: 'characters',
              rows: [
                expect.objectContaining({
                  canonicalEntry: [
                    {
                      op: 'set',
                      path: '杰瑞.counters',
                      oldValue: [],
                      newValue: [{ id: '汤姆' }],
                    },
                    {
                      op: 'set',
                      path: '杰瑞.counters',
                      oldValue: [{ id: '汤姆' }],
                      newValue: [{ id: '布奇' }],
                    },
                  ],
                }),
              ],
            }),
          ],
        }),
      })
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns bounded candidate-conflict guidance for relation drafts', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    publishPreparedMock.mockRejectedValueOnce(
      new TrustedGameDataMutationError('candidate_conflict', {
        detail: {
          code: 'missing_path',
          stage: 'apply',
          operation: 'set',
          path: '杰瑞.counters',
          rowId: 'proposed:characters:0',
          actionIndex: 0,
          targetIndex: 0,
          rootKey: '杰瑞',
        },
      })
    );
    const { POST } = await import('./route');

    const response = await POST(createRequest({ entries: validEntries }));

    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: string; requestId: string };
    expect(body).toEqual({
      error: 'candidate_conflict',
      message: expect.any(String) as string,
      requestId: expect.any(String) as string,
    });
    expect(warnSpy).toHaveBeenCalledWith('game_data_publish_rejected', expect.any(String));
    const logged = JSON.parse(warnSpy.mock.calls[0]?.[1] as string) as Record<string, unknown>;
    expect(logged).toEqual(
      expect.objectContaining({
        event: 'candidate_conflict',
        requestId: body.requestId,
        route: '/api/game-data-actions/publish-relations',
        replayError: expect.objectContaining({
          code: 'missing_path',
          path: '杰瑞.counters',
          rowId: 'proposed:characters:0',
        }),
      })
    );
    warnSpy.mockRestore();
  });

  it('keeps replay epoch conflicts on their stable 409 response', async () => {
    publishPreparedMock.mockRejectedValueOnce(
      new TrustedGameDataMutationError('replay_epoch_conflict')
    );
    const { POST } = await import('./route');

    const response = await POST(createRequest({ entries: validEntries }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'replay_epoch_conflict' });
  });
});
