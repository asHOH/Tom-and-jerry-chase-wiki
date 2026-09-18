import { requirePermission, requirePermissionOrAnonymous } from '@/lib/auth/requirePermission';
import {
  notifyPendingGameDataActionSubscribers,
  publishNotification,
} from '@/lib/notificationUtils';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

import { checkPendingActionAcknowledgement } from './pendingActionAwarenessServer';
import type { PendingActionOverlapResponse } from './pendingActionAwarenessTypes';
import { handleGameDataSubmission } from './submission';
import {
  publishPreparedGameDataActions,
  TrustedGameDataMutationError,
} from './trustedGameDataMutations';

const jsonResponse = (body: unknown, init?: { status?: number }) =>
  ({ status: init?.status ?? 200, json: async () => body }) as Response;

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => jsonResponse(body, init)),
  },
}));
jest.mock('@/lib/auth/requirePermission', () => ({
  requirePermission: jest.fn(),
  requirePermissionOrAnonymous: jest.fn(),
}));
jest.mock('@/lib/blocks/server', () => ({ getRequestIp: () => '192.0.2.1' }));
jest.mock('@/lib/supabase/admin', () => ({ hasSupabaseAdminConfig: jest.fn() }));
jest.mock('@/lib/supabase/config', () => ({ hasSupabasePublicConfig: () => true }));
jest.mock('./pendingActionAwarenessServer', () => ({
  checkPendingActionAcknowledgement: jest.fn(),
}));
jest.mock('./trustedGameDataMutations', () => {
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
jest.mock('@/lib/notificationUtils', () => ({
  notifyPendingGameDataActionSubscribers: jest.fn(),
  publishNotification: jest.fn(),
}));

const operationId = 'a3bb189e-8c21-4b8d-9a4f-5e24b7c29a10';
const overlap: PendingActionOverlapResponse = {
  error: 'pending_action_overlap',
  pendingAcknowledgementToken: `v1:${'a'.repeat(64)}`,
  targets: [],
  affectedPathCount: 1,
  ownCount: 0,
  otherCount: 1,
  publicCount: 0,
  truncated: false,
};

function createRequest(body: unknown): Request {
  const bytes = new TextEncoder().encode(JSON.stringify(body));
  let delivered = false;
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === 'idempotency-key' ? operationId : null),
    },
    body: {
      getReader: () => ({
        read: async () => {
          if (delivered) return { done: true, value: undefined };
          delivered = true;
          return { done: false, value: bytes };
        },
        cancel: async () => undefined,
      }),
    },
  } as unknown as Request;
}

describe.each(['ordinary', 'relations'] as const)('%s submission workflow', (kind) => {
  const permission =
    kind === 'relations' ? 'game_data_action.publish_relations' : 'game_data_action.create';
  const authorize = jest.mocked(
    kind === 'relations' ? requirePermission : requirePermissionOrAnonymous
  );
  const otherAuthorize = jest.mocked(
    kind === 'relations' ? requirePermissionOrAnonymous : requirePermission
  );
  const body = {
    entityType: 'characters',
    entries: [
      [
        { op: 'set', path: ' 杰瑞.counters ', newValue: [{ id: '汤姆' }] },
        { op: 'set', path: ' 汤姆.counteredBy ', newValue: [{ id: '杰瑞' }] },
      ],
    ],
  };
  const results = [{ id: 'action-1', is_public: false, status: 'pending' as const }];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(notifyPendingGameDataActionSubscribers).mockReset();
    jest.mocked(publishNotification).mockReset();
    authorize.mockResolvedValue({
      supabase: {} as never,
      userId: 'actor-1',
      grants: [{ permission, scope: 'global', resourceType: null, resourceId: null }],
    });
    jest.mocked(hasSupabaseAdminConfig).mockReturnValue(true);
    jest.mocked(checkPendingActionAcknowledgement).mockResolvedValue(null);
    jest.mocked(publishPreparedGameDataActions).mockResolvedValue(results);
  });

  it('checks every canonical resource before overlap detection or persistence', async () => {
    const response = await handleGameDataSubmission(createRequest(body), kind);

    expect(response.status).toBe(200);
    expect(authorize).toHaveBeenNthCalledWith(
      2,
      permission,
      [
        { resourceType: 'characters', resourceId: '杰瑞' },
        { resourceType: 'characters', resourceId: '汤姆' },
      ],
      'all',
      expect.objectContaining({ blockAction: 'edit' })
    );
    expect(otherAuthorize).not.toHaveBeenCalled();
    expect(authorize.mock.invocationCallOrder[1]).toBeLessThan(
      jest.mocked(checkPendingActionAcknowledgement).mock.invocationCallOrder[0]!
    );
    expect(publishPreparedGameDataActions).toHaveBeenCalledWith(
      expect.objectContaining({ permission, operationId, clientIp: '192.0.2.1' })
    );
  });

  it('preserves a scoped block response without running later steps', async () => {
    const denied = jsonResponse({ error: 'Blocked', reason: 'edit block' }, { status: 403 });
    authorize.mockResolvedValueOnce({ supabase: {} as never, userId: 'actor-1', grants: [] });
    authorize.mockResolvedValueOnce({ error: denied as never });

    const response = await handleGameDataSubmission(createRequest(body), kind);

    expect(response).toBe(denied);
    expect(checkPendingActionAcknowledgement).not.toHaveBeenCalled();
    expect(publishPreparedGameDataActions).not.toHaveBeenCalled();
    expect(notifyPendingGameDataActionSubscribers).not.toHaveBeenCalled();
  });

  it('returns overlap unchanged, then forwards the acknowledgement and operation ID on retry', async () => {
    jest.mocked(checkPendingActionAcknowledgement).mockResolvedValueOnce(overlap);
    const response = await handleGameDataSubmission(createRequest(body), kind);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(overlap);
    expect(publishPreparedGameDataActions).not.toHaveBeenCalled();
    expect(notifyPendingGameDataActionSubscribers).not.toHaveBeenCalled();
    expect(publishNotification).not.toHaveBeenCalled();

    const retry = await handleGameDataSubmission(
      createRequest({ ...body, pendingAcknowledgementToken: overlap.pendingAcknowledgementToken }),
      kind
    );

    expect(retry.status).toBe(200);
    expect(checkPendingActionAcknowledgement).toHaveBeenLastCalledWith(
      expect.objectContaining({
        userId: 'actor-1',
        providedToken: overlap.pendingAcknowledgementToken,
        operationId,
      })
    );
    expect(publishPreparedGameDataActions).toHaveBeenCalledTimes(1);
    await expect(retry.json()).resolves.toEqual({ result: results });
  });

  it('rejects malformed acknowledgement tokens before authorization', async () => {
    const response = await handleGameDataSubmission(
      createRequest({ ...body, pendingAcknowledgementToken: 'invalid' }),
      kind
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_shape' });
    expect(authorize).not.toHaveBeenCalled();
    expect(publishPreparedGameDataActions).not.toHaveBeenCalled();
  });

  it('still uses trusted persistence when advisory overlap detection fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const failure = new Error('unavailable');
    jest.mocked(checkPendingActionAcknowledgement).mockRejectedValueOnce(failure);

    const response = await handleGameDataSubmission(createRequest(body), kind);

    expect(response.status).toBe(200);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('failed open'), failure);
    expect(publishPreparedGameDataActions).toHaveBeenCalledTimes(1);
  });

  it('skips advisory overlap detection when admin configuration is absent', async () => {
    jest.mocked(hasSupabaseAdminConfig).mockReturnValue(false);

    const response = await handleGameDataSubmission(createRequest(body), kind);

    expect(response.status).toBe(200);
    expect(checkPendingActionAcknowledgement).not.toHaveBeenCalled();
    expect(publishPreparedGameDataActions).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['forbidden', 403, 'Forbidden'],
    ['idempotency_key_reused', 409, 'idempotency_key_reused'],
    ['replay_epoch_conflict', 409, 'replay_epoch_conflict'],
    ['persistence_failed', 500, 'Internal server error'],
  ] as const)('maps %s without sending notifications', async (code, status, error) => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest
      .mocked(publishPreparedGameDataActions)
      .mockRejectedValueOnce(new TrustedGameDataMutationError(code));

    const response = await handleGameDataSubmission(createRequest(body), kind);

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error });
    expect(notifyPendingGameDataActionSubscribers).not.toHaveBeenCalled();
    expect(publishNotification).not.toHaveBeenCalled();
  });

  it('keeps notifications exclusive to ordinary submissions and their failures non-fatal', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(notifyPendingGameDataActionSubscribers).mockRejectedValue(new Error('unavailable'));
    jest.mocked(publishNotification).mockRejectedValue(new Error('unavailable'));
    const mixedResults = [
      ...results,
      { id: 'action-2', is_public: true, status: 'approved' as const },
    ];
    jest.mocked(publishPreparedGameDataActions).mockResolvedValue(mixedResults);

    const response = await handleGameDataSubmission(
      createRequest({ ...body, entries: body.entries[0] }),
      kind
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ result: mixedResults });
    expect(notifyPendingGameDataActionSubscribers).toHaveBeenCalledTimes(
      kind === 'ordinary' ? 1 : 0
    );
    expect(publishNotification).toHaveBeenCalledTimes(kind === 'ordinary' ? 1 : 0);
  });
});
