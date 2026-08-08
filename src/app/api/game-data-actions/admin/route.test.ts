import type { NextRequest } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { GET } from './route';

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

jest.mock('@/lib/auth/requirePermission', () => ({
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const requirePermissionMock = jest.mocked(requirePermission);
const adminFromMock = jest.mocked(supabaseAdmin!.from);

const visibleRows = [
  {
    id: 'action-1',
    created_at: '2026-07-17T00:00:00.000Z',
    created_by: 'creator-1',
    entity_type: 'characters',
    entry: { op: 'set', path: '汤姆.description', newValue: 'updated' },
    is_public: false,
    message: 'test',
    rejection_reason: null,
    reviewed_at: null,
    reviewed_by: null,
    status: 'pending',
  },
];

function createActionQuery(rows = visibleRows) {
  const result = { data: rows, error: null };
  const query = {
    select: jest.fn(),
    order: jest.fn(),
    eq: jest.fn(),
    then: (
      onFulfilled: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

function createNicknameQuery() {
  const query = {
    select: jest.fn(),
    in: jest.fn(),
  };
  query.select.mockReturnValue(query);
  query.in.mockResolvedValue({
    data: [{ id: 'creator-1', nickname: '汤姆编辑者' }],
    error: null,
  });
  return query;
}

const createRequest = (status?: string) =>
  ({
    url: `https://example.test/api/game-data-actions/admin${status === undefined ? '' : `?status=${status}`}`,
  }) as NextRequest;

describe('admin game data actions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads action rows through the authenticated client so RLS scopes visibility', async () => {
    const actionQuery = createActionQuery();
    const nicknameQuery = createNicknameQuery();
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);
    adminFromMock.mockReturnValue(nicknameQuery as never);

    const response = await GET(createRequest('all'));

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith([
      'game_data_action.approve',
      'game_data_action.reject',
      'game_data_action.mark_synced',
      'game_data_action.revoke',
    ]);
    expect(supabase.from).toHaveBeenCalledWith('game_data_actions');
    expect(adminFromMock).toHaveBeenCalledTimes(1);
    expect(adminFromMock).toHaveBeenCalledWith('users_public_view');
    expect(nicknameQuery.in).toHaveBeenCalledWith('id', ['creator-1']);
    await expect(response.json()).resolves.toMatchObject({
      count: 1,
      submissions: [
        {
          action_id: 'action-1',
          created_by_nickname: '汤姆编辑者',
        },
      ],
    });
  });

  it('applies the requested status to the RLS-scoped action query', async () => {
    const actionQuery = createActionQuery();
    const nicknameQuery = createNicknameQuery();
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);
    adminFromMock.mockReturnValue(nicknameQuery as never);

    const response = await GET(createRequest('pending'));

    expect(response.status).toBe(200);
    expect(actionQuery.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('defaults the RLS-scoped action query to pending', async () => {
    const actionQuery = createActionQuery();
    const nicknameQuery = createNicknameQuery();
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);
    adminFromMock.mockReturnValue(nicknameQuery as never);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(actionQuery.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('rejects an unknown status instead of querying all actions', async () => {
    const supabase = { from: jest.fn() };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET(createRequest('unknown'));

    expect(response.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
