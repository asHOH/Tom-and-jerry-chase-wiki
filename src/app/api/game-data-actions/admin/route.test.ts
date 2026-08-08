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
    id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    created_at: '2026-07-17T00:00:00.000Z',
    created_by: 'creator-1',
    entity_type: 'characters',
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
    or: jest.fn(),
    limit: jest.fn(),
    then: (
      onFulfilled: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.limit.mockReturnValue(query);
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

const createRequest = (search = '') =>
  ({
    url: `https://example.test/api/game-data-actions/admin${search ? `?${search}` : ''}`,
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

    const response = await GET(createRequest('status=all'));

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
      nextCursor: null,
      submissions: [
        {
          action_id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
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

    const response = await GET(createRequest('status=pending'));

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

    const response = await GET(createRequest('status=unknown'));

    expect(response.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('applies canonical entity filtering, deterministic ordering, and a bounded limit', async () => {
    const actionQuery = createActionQuery();
    const nicknameQuery = createNicknameQuery();
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);
    adminFromMock.mockReturnValue(nicknameQuery as never);

    const response = await GET(createRequest('status=pending&entityType=characters&limit=25'));

    expect(response.status).toBe(200);
    expect(actionQuery.eq).toHaveBeenCalledWith('status', 'pending');
    expect(actionQuery.eq).toHaveBeenCalledWith('entity_type', 'characters');
    expect(actionQuery.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
    expect(actionQuery.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(actionQuery.limit).toHaveBeenCalledWith(26);
    expect(actionQuery.select).toHaveBeenCalledWith(expect.not.stringContaining('entry'));
  });

  it.each([
    ['entityType=unknown', 'entity type'],
    ['limit=0', 'low limit'],
    ['limit=101', 'high limit'],
    ['limit=abc', 'non-numeric limit'],
    ['cursor=malformed', 'malformed cursor'],
  ])('rejects %s before running an action query (%s)', async (search) => {
    const supabase = { from: jest.fn() };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET(createRequest(search));

    expect(response.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('performs exact UUID lookup independently of the other list filters', async () => {
    const actionQuery = createActionQuery();
    const nicknameQuery = createNicknameQuery();
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);
    adminFromMock.mockReturnValue(nicknameQuery as never);
    const actionId = 'de305d54-75b4-431b-adb2-eb6b9e546014';

    const response = await GET(
      createRequest(
        `actionId=${actionId}&status=unknown&entityType=unknown&cursor=malformed&limit=0`
      )
    );

    expect(response.status).toBe(200);
    expect(actionQuery.eq).toHaveBeenCalledWith('id', actionId);
    expect(actionQuery.eq).toHaveBeenCalledTimes(1);
    expect(actionQuery.or).not.toHaveBeenCalled();
    expect(actionQuery.limit).toHaveBeenCalledWith(1);
  });

  it('returns a filter-bound cursor and applies both keyset boundary columns', async () => {
    const secondRow = {
      ...visibleRows[0]!,
      id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
      created_at: '2026-07-16T00:00:00.000Z',
    };
    const firstQuery = createActionQuery([visibleRows[0]!, secondRow]);
    const nicknameQuery = createNicknameQuery();
    const supabase = { from: jest.fn(() => firstQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);
    adminFromMock.mockReturnValue(nicknameQuery as never);

    const firstResponse = await GET(createRequest('status=pending&limit=1'));
    const firstPayload = (await firstResponse.json()) as { nextCursor: string };

    expect(firstPayload.nextCursor).toEqual(expect.any(String));

    const cursorQuery = createActionQuery([secondRow]);
    supabase.from.mockReturnValue(cursorQuery);
    const cursorResponse = await GET(
      createRequest(`status=pending&limit=1&cursor=${encodeURIComponent(firstPayload.nextCursor)}`)
    );

    expect(cursorResponse.status).toBe(200);
    expect(cursorQuery.or).toHaveBeenCalledWith(
      `created_at.lt.${visibleRows[0]!.created_at},and(created_at.eq.${visibleRows[0]!.created_at},id.lt.${visibleRows[0]!.id})`
    );
  });

  it('rejects a cursor reused with a different filter set', async () => {
    const cursor = Buffer.from(
      JSON.stringify({
        version: 1,
        createdAt: visibleRows[0]!.created_at,
        id: visibleRows[0]!.id,
        status: 'pending',
        entityType: null,
      })
    ).toString('base64url');
    const supabase = { from: jest.fn() };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET(
      createRequest(`status=approved&cursor=${encodeURIComponent(cursor)}`)
    );

    expect(response.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
