import { requirePermission } from '@/lib/auth/requirePermission';

import { GET } from './route';

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(jsonResponse),
  },
}));

jest.mock('@/lib/auth/requirePermission', () => ({
  requirePermission: jest.fn(),
}));

const requirePermissionMock = jest.mocked(requirePermission);
const rpcMock = jest.fn();

describe('game data pending route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpcMock.mockResolvedValue({ data: [], error: null });
    requirePermissionMock.mockResolvedValue({
      supabase: { rpc: rpcMock },
      userId: 'moderator-1',
      grants: [
        {
          permission: 'game_data_action.revoke',
          scope: 'global',
          resourceType: null,
          resourceId: null,
        },
      ],
    } as never);
  });

  it('allows revoke-only moderators to load pending actions', async () => {
    const response = await GET({} as never);

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith([
      'game_data_action.approve',
      'game_data_action.reject',
      'game_data_action.revoke',
    ]);
    expect(rpcMock).toHaveBeenCalledWith('get_pending_game_data_actions');
  });
});
