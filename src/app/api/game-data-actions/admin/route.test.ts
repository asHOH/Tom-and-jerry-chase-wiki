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

type TestActionRow = {
  id: string;
  created_at: string;
  created_by: string | null;
  entity_type: string;
  is_public: boolean;
  message: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';
};

const visibleRows: TestActionRow[] = [
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

function createActionQuery(
  rows = visibleRows,
  count: number | null = rows.length,
  error: { message: string } | null = null
) {
  const result = { data: rows, error, count };
  const query = {
    select: jest.fn(),
    order: jest.fn(),
    eq: jest.fn(),
    range: jest.fn(),
    limit: jest.fn(),
    then: (
      onFulfilled: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.range.mockReturnValue(query);
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
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
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
    expect(actionQuery.range).toHaveBeenCalledWith(0, 49);
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

  it('applies canonical filters, exact counting, deterministic ordering, and page ranges', async () => {
    const actionQuery = createActionQuery(visibleRows, 101);
    const nicknameQuery = createNicknameQuery();
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);
    adminFromMock.mockReturnValue(nicknameQuery as never);

    const response = await GET(createRequest('status=pending&entityType=characters&page=2'));

    expect(response.status).toBe(200);
    expect(actionQuery.eq).toHaveBeenCalledWith('status', 'pending');
    expect(actionQuery.eq).toHaveBeenCalledWith('entity_type', 'characters');
    expect(actionQuery.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
    expect(actionQuery.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(actionQuery.range).toHaveBeenCalledWith(50, 99);
    expect(actionQuery.select).toHaveBeenCalledWith(expect.not.stringContaining('entry'), {
      count: 'exact',
    });
    await expect(response.json()).resolves.toMatchObject({
      currentPage: 2,
      totalPages: 3,
      totalCount: 101,
    });
  });

  it.each([
    ['entityType=unknown', 'entity type'],
    ['page=0', 'zero page'],
    ['page=10001', 'page above the bound'],
    ['page=1.5', 'fractional page'],
    ['page=abc', 'non-numeric page'],
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
      createRequest(`actionId=${actionId}&status=unknown&entityType=unknown&page=0`)
    );

    expect(response.status).toBe(200);
    expect(actionQuery.eq).toHaveBeenCalledWith('id', actionId);
    expect(actionQuery.eq).toHaveBeenCalledTimes(1);
    expect(actionQuery.limit).toHaveBeenCalledWith(1);
    await expect(response.json()).resolves.toMatchObject({
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
    });
  });

  it('returns zero-page metadata for an empty filtered list', async () => {
    const actionQuery = createActionQuery([], 0);
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET(createRequest('status=rejected&page=1'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      submissions: [],
      currentPage: 0,
      totalPages: 0,
      totalCount: 0,
    });
  });

  it('returns zero-page metadata when an exact action ID is not visible', async () => {
    const actionQuery = createActionQuery([], 0);
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET(createRequest('actionId=de305d54-75b4-431b-adb2-eb6b9e546014'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      submissions: [],
      currentPage: 0,
      totalPages: 0,
      totalCount: 0,
    });
  });

  it('fails when the exact filtered count is missing', async () => {
    const actionQuery = createActionQuery([], null);
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET(createRequest('status=all'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to count actions' });
  });

  it('returns a structured failure when the filtered page query fails', async () => {
    const actionQuery = createActionQuery([], 0, { message: 'query failed' });
    const supabase = { from: jest.fn(() => actionQuery) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET(createRequest('status=all'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch actions' });
  });
});
