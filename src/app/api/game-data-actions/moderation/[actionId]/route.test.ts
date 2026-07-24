import type { NextRequest } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import {
  approvePreparedGameDataAction,
  loadTrustedGameDataAction,
  markPreparedGameDataActionSynced,
  revokePreparedGameDataAction,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import { publishNotification } from '@/lib/notificationUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';

const jsonResponse = (body: unknown, init?: { status?: number }) =>
  ({ status: init?.status ?? 200, json: async () => body }) as Response;

jest.mock('next/server', () => ({ NextResponse: { json: jest.fn(jsonResponse) } }));
jest.mock('@/lib/auth/requirePermission', () => ({ requirePermission: jest.fn() }));
jest.mock('@/lib/gameData/trustedGameDataMutations', () => {
  class MockTrustedGameDataMutationError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  }
  return {
    approvePreparedGameDataAction: jest.fn(),
    loadTrustedGameDataAction: jest.fn(),
    markPreparedGameDataActionSynced: jest.fn(),
    revokePreparedGameDataAction: jest.fn(),
    TrustedGameDataMutationError: MockTrustedGameDataMutationError,
  };
});
jest.mock('@/lib/notificationUtils', () => ({ publishNotification: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { rpc: jest.fn() } }));

const requirePermissionMock = jest.mocked(requirePermission);
const loadRecordMock = jest.mocked(loadTrustedGameDataAction);
const approveMock = jest.mocked(approvePreparedGameDataAction);
const markSyncedMock = jest.mocked(markPreparedGameDataActionSynced);
const revokeMock = jest.mocked(revokePreparedGameDataAction);
const publishNotificationMock = jest.mocked(publishNotification);
const adminRpcMock = jest.mocked(supabaseAdmin.rpc);
const rpcMock = jest.fn().mockResolvedValue({ error: null });

const record = (status: 'pending' | 'approved' = 'pending') => ({
  id: 'action-1',
  entity_type: 'characters',
  entry: { op: 'set', path: '杰瑞.description', newValue: 'new' },
  created_at: '2026-07-18T00:00:00.000Z',
  created_by: 'user-2',
  status,
  is_public: status === 'approved',
});

const createRequest = (action: string, body?: unknown) =>
  ({
    json: async () => body ?? {},
    url: `https://tjwiki.test/api/game-data-actions/moderation/action-1?action=${action}`,
  }) as NextRequest;

describe('game data action moderation route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpcMock.mockResolvedValue({ error: null });
    adminRpcMock.mockResolvedValue({ error: null } as never);
    requirePermissionMock.mockResolvedValue({
      supabase: { rpc: rpcMock },
      userId: 'moderator-1',
      grants: [
        {
          permission: 'game_data_action.approve',
          scope: 'global',
          resourceType: null,
          resourceId: null,
        },
        {
          permission: 'game_data_action.reject',
          scope: 'global',
          resourceType: null,
          resourceId: null,
        },
        {
          permission: 'game_data_action.mark_synced',
          scope: 'global',
          resourceType: null,
          resourceId: null,
        },
        {
          permission: 'game_data_action.revoke',
          scope: 'global',
          resourceType: null,
          resourceId: null,
        },
      ],
    } as never);
    loadRecordMock.mockResolvedValue(record());
    publishNotificationMock.mockResolvedValue({
      created: true,
      suppressed: false,
      emailStatus: 'skipped',
    });
  });

  it('marks approved rows synced only through the trusted prepared mutation', async () => {
    loadRecordMock.mockResolvedValue(record('approved'));
    const { POST } = await import('./route');

    const response = await POST(createRequest('mark-synced'), {
      params: Promise.resolve({ actionId: 'action-1' }),
    });

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith(
      'game_data_action.mark_synced',
      undefined,
      'all',
      expect.objectContaining({ blockAction: 'edit', request: expect.anything() })
    );
    expect(markSyncedMock).toHaveBeenCalledWith('moderator-1', record('approved'), null);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('approves through complete candidate replay and publishes the existing notification', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest('approve'), {
      params: Promise.resolve({ actionId: 'action-1' }),
    });

    expect(response.status).toBe(200);
    expect(approveMock).toHaveBeenCalledWith('moderator-1', record(), null);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(publishNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: 'user-2', kind: 'game_data_action_approved' })
    );
  });

  it('keeps rejection on its existing permission-checked RPC path', async () => {
    const { POST } = await import('./route');

    const response = await POST(createRequest('reject', { reason: '不通过' }), {
      params: Promise.resolve({ actionId: 'action-1' }),
    });

    expect(response.status).toBe(200);
    expect(adminRpcMock).toHaveBeenCalledWith('prepared_reject_game_data_action', {
      p_actor_id: 'moderator-1',
      p_action_id: 'action-1',
      p_reason: '不通过',
      p_ip: null,
    });
    expect(approveMock).not.toHaveBeenCalled();
  });

  it('revokes approved rows through the trusted prepared mutation', async () => {
    loadRecordMock.mockResolvedValue(record('approved'));
    const { POST } = await import('./route');

    const response = await POST(createRequest('revoke'), {
      params: Promise.resolve({ actionId: 'action-1' }),
    });

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith(
      'game_data_action.revoke',
      undefined,
      'all',
      expect.objectContaining({ blockAction: 'edit', request: expect.anything() })
    );
    expect(revokeMock).toHaveBeenCalledWith('moderator-1', record('approved'), null);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(publishNotificationMock).not.toHaveBeenCalled();
  });

  it.each(['invalid_row', 'candidate_conflict', 'replay_epoch_conflict'])(
    'leaves the row unchanged and maps %s to 409',
    async (code) => {
      approveMock.mockRejectedValueOnce(new TrustedGameDataMutationError(code as never));
      const { POST } = await import('./route');

      const response = await POST(createRequest('approve'), {
        params: Promise.resolve({ actionId: 'action-1' }),
      });

      expect(response.status).toBe(409);
      expect(publishNotificationMock).not.toHaveBeenCalled();
    }
  );
});
