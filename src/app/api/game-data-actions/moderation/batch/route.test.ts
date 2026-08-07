import { requirePermission } from '@/lib/auth/requirePermission';
import {
  approvePreparedGameDataAction,
  loadTrustedGameDataAction,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import { publishNotification } from '@/lib/notificationUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { POST } from './route';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(
      (body: unknown, init?: { status?: number }) =>
        ({ status: init?.status ?? 200, json: async () => body }) as Response
    ),
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
    approvePreparedGameDataAction: jest.fn(),
    loadTrustedGameDataAction: jest.fn(),
    TrustedGameDataMutationError: MockTrustedGameDataMutationError,
  };
});
jest.mock('@/lib/notificationUtils', () => ({ publishNotification: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { rpc: jest.fn() } }));

const requirePermissionMock = jest.mocked(requirePermission);
const loadRecordMock = jest.mocked(loadTrustedGameDataAction);
const approveMock = jest.mocked(approvePreparedGameDataAction);
const publishNotificationMock = jest.mocked(publishNotification);
const adminRpcMock = jest.mocked(supabaseAdmin!.rpc);
const actionId1 = '00000000-0000-4000-8000-000000000001';
const actionId2 = '00000000-0000-4000-8000-000000000002';
const rpcMock = jest.fn().mockResolvedValue({ error: null });

const record = (id: string, isPublic = false) => ({
  id,
  created_by: 'user-1',
  entity_type: 'characters',
  entry: { op: 'set', path: `${id}.description`, newValue: 'new' },
  created_at: '2026-07-18T00:00:00.000Z',
  status: 'pending' as const,
  is_public: isPublic,
});

const createRequest = (action: 'approve' | 'reject', actionIds = [actionId1, actionId2]) =>
  ({ json: async () => ({ action, actionIds }) }) as Request;

describe('batch game data action moderation route', () => {
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
      ],
    } as never);
    loadRecordMock.mockImplementation(async (id) => record(id));
    publishNotificationMock.mockResolvedValue({
      created: true,
      suppressed: false,
      emailStatus: 'skipped',
    });
  });

  it('approves each database row independently through the trusted path', async () => {
    const response = await POST(createRequest('approve'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      succeeded: [actionId1, actionId2],
      failures: [],
    });
    expect(approveMock).toHaveBeenNthCalledWith(1, 'moderator-1', record(actionId1), null);
    expect(approveMock).toHaveBeenNthCalledWith(2, 'moderator-1', record(actionId2), null);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('reports a malformed or conflicting row without approving or hiding other results', async () => {
    approveMock.mockRejectedValueOnce(new TrustedGameDataMutationError('invalid_row'));

    const response = await POST(createRequest('approve'));

    await expect(response.json()).resolves.toEqual({
      succeeded: [actionId2],
      failures: [{ actionId: actionId1, message: 'invalid_row' }],
    });
    expect(publishNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ sourceIds: [actionId2] })
    );
  });

  it('keeps rejection available without requiring successful action decoding', async () => {
    const response = await POST(createRequest('reject', [actionId1]));

    expect(response.status).toBe(200);
    expect(adminRpcMock).toHaveBeenCalledWith('prepared_reject_game_data_action', {
      p_actor_id: 'moderator-1',
      p_action_id: actionId1,
      p_reason: '',
      p_ip: null,
    });
    expect(approveMock).not.toHaveBeenCalled();
  });

  it('reports public pending rows as revoke-only when batch rejecting', async () => {
    loadRecordMock.mockImplementation(async (id) => record(id, true));

    const response = await POST(createRequest('reject', [actionId1]));

    await expect(response.json()).resolves.toEqual({
      succeeded: [],
      failures: [{ actionId: actionId1, message: 'Action is already public; use revoke instead' }],
    });
    expect(adminRpcMock).not.toHaveBeenCalled();
  });
});
