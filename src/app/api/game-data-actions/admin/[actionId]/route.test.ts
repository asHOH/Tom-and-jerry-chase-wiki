import type { NextRequest } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';

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

const requirePermissionMock = jest.mocked(requirePermission);
const actionId = 'de305d54-75b4-431b-adb2-eb6b9e546014';

function createDetailQuery(data: { id: string; entry: unknown } | null) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

describe('admin game data action detail route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads one full entry through the authenticated RLS client', async () => {
    const detail = { id: actionId, entry: { op: 'set', path: '汤姆.description' } };
    const query = createDetailQuery(detail);
    const supabase = { from: jest.fn(() => query) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET({} as NextRequest, { params: Promise.resolve({ actionId }) });

    expect(response.status).toBe(200);
    expect(supabase.from).toHaveBeenCalledWith('game_data_actions');
    expect(query.select).toHaveBeenCalledWith('id, entry');
    expect(query.eq).toHaveBeenCalledWith('id', actionId);
    await expect(response.json()).resolves.toEqual({ action_id: actionId, entry: detail.entry });
  });

  it('returns 404 when RLS exposes no matching row', async () => {
    const query = createDetailQuery(null);
    const supabase = { from: jest.fn(() => query) };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET({} as NextRequest, { params: Promise.resolve({ actionId }) });

    expect(response.status).toBe(404);
  });

  it('rejects malformed IDs without querying the table', async () => {
    const supabase = { from: jest.fn() };
    requirePermissionMock.mockResolvedValue({ supabase } as never);

    const response = await GET({} as NextRequest, {
      params: Promise.resolve({ actionId: 'not-a-uuid' }),
    });

    expect(response.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
