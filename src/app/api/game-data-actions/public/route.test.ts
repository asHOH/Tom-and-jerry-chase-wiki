const jsonResponse = (body: unknown, init?: { status?: number }) =>
  ({
    status: init?.status ?? 200,
    json: async () => body,
  }) as Response;

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(jsonResponse),
  },
}));

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_DISABLE_ARTICLES: '0',
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  },
}));

const query = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('public game data actions route', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockImplementation((column: string) =>
      column === 'id' ? Promise.resolve({ data: [], error: null }) : query
    );

    const { createClient } = jest.requireMock('@/lib/supabase/server') as {
      createClient: jest.Mock;
    };
    createClient.mockResolvedValue({ from: jest.fn(() => query) });
  });

  it('should select approved replay rows in deterministic order', async () => {
    const { GET } = await import('./route');

    const response = await GET();

    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenNthCalledWith(1, 'is_public', true);
    expect(query.eq).toHaveBeenNthCalledWith(2, 'status', 'approved');
    expect(query.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
  });

  it('should preserve the public response schema when the shared reader selects metadata', async () => {
    query.order.mockImplementation((column: string) =>
      column === 'id'
        ? Promise.resolve({
            data: [
              {
                id: 'action-id',
                entity_type: 'characters',
                entry: { op: 'set', path: 'Tom.name', newValue: 'Thomas' },
                created_at: '2026-07-17T00:00:00.000Z',
                status: 'approved',
                message: 'metadata must not leak into the legacy response',
                reviewed_at: '2026-07-17T00:01:00.000Z',
                created_by: 'user-id',
              },
            ],
            error: null,
          })
        : query
    );
    const { GET } = await import('./route');

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      actions: [
        {
          id: 'action-id',
          entity_type: 'characters',
          entry: { op: 'set', path: 'Tom.name', newValue: 'Thomas' },
          created_at: '2026-07-17T00:00:00.000Z',
        },
      ],
    });
  });

  it('should preserve the error response when the replay query fails', async () => {
    query.order.mockImplementation((column: string) =>
      column === 'id' ? Promise.resolve({ data: null, error: { message: 'query failed' } }) : query
    );
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { GET } = await import('./route');

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch public actions' });
    consoleError.mockRestore();
  });
});
