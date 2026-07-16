const jsonResponse = (body: unknown, init?: { status?: number }) =>
  ({
    status: init?.status ?? 200,
    json: async () => body,
  }) as Response;

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

  it('should use the action id as the deterministic timestamp tie-breaker', async () => {
    const { GET } = await import('./route');

    const response = await GET();

    expect(response.status).toBe(200);
    expect(query.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
  });
});
