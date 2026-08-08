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

function createInMemoryActionQuery(sourceRows: TestActionRow[]) {
  const equalities = new Map<string, string>();
  let boundary: { createdAt: string; id: string } | null = null;
  let requestedLimit = sourceRows.length;
  const query = {
    select: jest.fn(),
    order: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    limit: jest.fn(),
    then: (
      onFulfilled: (value: { data: TestActionRow[]; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => {
      const data = sourceRows
        .filter((row) =>
          [...equalities].every(([column, value]) => row[column as keyof TestActionRow] === value)
        )
        .filter(
          (row) =>
            boundary === null ||
            row.created_at < boundary.createdAt ||
            (row.created_at === boundary.createdAt && row.id < boundary.id)
        )
        .toSorted(
          (left, right) =>
            right.created_at.localeCompare(left.created_at) || right.id.localeCompare(left.id)
        )
        .slice(0, requestedLimit);
      return Promise.resolve({ data, error: null }).then(onFulfilled, onRejected);
    },
  };
  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.eq.mockImplementation((column: string, value: string) => {
    equalities.set(column, value);
    return query;
  });
  query.or.mockImplementation((value: string) => {
    const match = /^created_at\.lt\.(.+),and\(created_at\.eq\.(.+),id\.lt\.([^)]+)\)$/u.exec(value);
    if (match?.[1] && match[2] === match[1] && match[3]) {
      boundary = { createdAt: match[1], id: match[3] };
    }
    return query;
  });
  query.limit.mockImplementation((value: number) => {
    requestedLimit = value;
    return query;
  });
  return query;
}

function createPaginationRow(
  sequence: number,
  createdAt: string,
  status: TestActionRow['status'] = 'pending'
): TestActionRow {
  return {
    id: `00000000-0000-4000-8000-${sequence.toString().padStart(12, '0')}`,
    created_at: createdAt,
    created_by: null,
    entity_type: 'characters',
    is_public: false,
    message: null,
    rejection_reason: null,
    reviewed_at: null,
    reviewed_by: null,
    status,
  };
}

type ListPayload = {
  submissions: Array<{ action_id: string }>;
  nextCursor: string | null;
};

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

  it('paginates equal timestamps without duplicates or omissions for unchanged rows', async () => {
    const sharedTimestamp = '2026-07-17T00:00:00.000Z';
    const rows = [
      createPaginationRow(5, sharedTimestamp),
      createPaginationRow(4, sharedTimestamp),
      createPaginationRow(3, sharedTimestamp),
      createPaginationRow(2, '2026-07-16T00:00:00.000Z'),
      createPaginationRow(1, '2026-07-15T00:00:00.000Z'),
    ];
    const supabase = { from: jest.fn(() => createInMemoryActionQuery(rows)) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const seenIds: string[] = [];
    let cursor: string | null = null;
    do {
      const response = await GET(
        createRequest(
          `status=pending&limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
        )
      );
      const payload = (await response.json()) as ListPayload;
      seenIds.push(...payload.submissions.map((submission) => submission.action_id));
      cursor = payload.nextCursor;
    } while (cursor !== null);

    expect(seenIds).toEqual(rows.map((row) => row.id));
    expect(new Set(seenIds).size).toBe(rows.length);
  });

  it('does not duplicate or omit unchanged rows when a newer row is inserted between pages', async () => {
    const rows = [
      createPaginationRow(4, '2026-07-17T04:00:00.000Z'),
      createPaginationRow(3, '2026-07-17T03:00:00.000Z'),
      createPaginationRow(2, '2026-07-17T02:00:00.000Z'),
      createPaginationRow(1, '2026-07-17T01:00:00.000Z'),
    ];
    const originalIds = rows.map((row) => row.id);
    const supabase = { from: jest.fn(() => createInMemoryActionQuery(rows)) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const firstPayload = (await (
      await GET(createRequest('status=pending&limit=2'))
    ).json()) as ListPayload;
    const inserted = createPaginationRow(5, '2026-07-17T03:30:00.000Z');
    rows.push(inserted);
    const secondPayload = (await (
      await GET(
        createRequest(
          `status=pending&limit=2&cursor=${encodeURIComponent(firstPayload.nextCursor!)}`
        )
      )
    ).json()) as ListPayload;
    const seenIds = [...firstPayload.submissions, ...secondPayload.submissions].map(
      (submission) => submission.action_id
    );

    expect(seenIds).toEqual(originalIds);
    expect(seenIds).not.toContain(inserted.id);
    expect(new Set(seenIds).size).toBe(originalIds.length);
  });

  it('reflects expected pending membership changes between cursor requests', async () => {
    const rows = [
      createPaginationRow(5, '2026-07-17T05:00:00.000Z'),
      createPaginationRow(4, '2026-07-17T04:00:00.000Z'),
      createPaginationRow(3, '2026-07-17T03:00:00.000Z'),
      createPaginationRow(2, '2026-07-17T02:00:00.000Z'),
      createPaginationRow(1, '2026-07-17T01:00:00.000Z', 'approved'),
    ];
    const supabase = { from: jest.fn(() => createInMemoryActionQuery(rows)) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const firstPayload = (await (
      await GET(createRequest('status=pending&limit=2'))
    ).json()) as ListPayload;
    rows[2]!.status = 'approved';
    rows[0]!.status = 'approved';
    rows[4]!.status = 'pending';
    const secondPayload = (await (
      await GET(
        createRequest(
          `status=pending&limit=2&cursor=${encodeURIComponent(firstPayload.nextCursor!)}`
        )
      )
    ).json()) as ListPayload;

    expect(firstPayload.submissions.map((submission) => submission.action_id)).toEqual([
      rows[0]!.id,
      rows[1]!.id,
    ]);
    expect(secondPayload.submissions.map((submission) => submission.action_id)).toEqual([
      rows[3]!.id,
      rows[4]!.id,
    ]);
  });
});
