import { canAccessAll } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/requirePermission';
import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { publishNotification } from '@/lib/notificationUtils';

import { POST } from './route';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(
      (body: unknown, init?: { status?: number }) =>
        ({
          status: init?.status ?? 200,
          json: async () => body,
        }) as Response
    ),
  },
}));

jest.mock('@/lib/auth/permissions', () => ({
  canAccessAll: jest.fn(),
}));

jest.mock('@/lib/auth/requirePermission', () => ({
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/gameData/publicActionsCache', () => ({
  invalidatePublicGameDataActionsCache: jest.fn(),
}));

jest.mock('@/lib/notificationUtils', () => ({
  publishNotification: jest.fn(),
}));

const canAccessAllMock = jest.mocked(canAccessAll);
const requirePermissionMock = jest.mocked(requirePermission);
const invalidatePublicGameDataActionsCacheMock = jest.mocked(invalidatePublicGameDataActionsCache);
const publishNotificationMock = jest.mocked(publishNotification);

const createRequest = (action: 'approve' | 'reject') =>
  ({
    json: async () => ({ action, actionIds: ['00000000-0000-4000-8000-000000000001'] }),
  }) as Request;

const createSupabaseMock = () => {
  const records = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      created_by: 'user-1',
      entity_type: 'characters',
      entry: { op: 'set', path: '汤姆.description' },
    },
  ];
  const recordsQuery = {
    select: jest.fn(),
    in: jest.fn(),
    eq: jest.fn(),
  };
  recordsQuery.select.mockReturnValue(recordsQuery);
  recordsQuery.in.mockReturnValue(recordsQuery);
  recordsQuery.eq.mockResolvedValue({ data: records, error: null });

  return {
    from: jest.fn(() => recordsQuery),
    rpc: jest.fn().mockResolvedValue({ error: null }),
  };
};

describe('batch game data action moderation route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    canAccessAllMock.mockReturnValue(true);
    publishNotificationMock.mockResolvedValue({
      created: true,
      suppressed: false,
      emailStatus: 'skipped',
    });
  });

  it('should expire public actions after approving at least one action', async () => {
    const supabase = createSupabaseMock();
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await POST(createRequest('approve'));

    expect(response.status).toBe(200);
    expect(invalidatePublicGameDataActionsCacheMock).toHaveBeenCalledTimes(1);
  });

  it('should not expire public actions after rejecting actions', async () => {
    const supabase = createSupabaseMock();
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await POST(createRequest('reject'));

    expect(response.status).toBe(200);
    expect(invalidatePublicGameDataActionsCacheMock).not.toHaveBeenCalled();
  });
});
