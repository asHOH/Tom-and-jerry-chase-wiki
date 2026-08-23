import { GET } from './route';

const mockGetPublicClient = jest.fn();

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));
jest.mock('@/lib/gameData/publicRouteMetrics', () => ({
  logPublicGameDataRouteMetric: jest.fn(),
}));
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS: 3600,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));
jest.mock('@/lib/serverCache', () => ({
  createCached: (_key: unknown, reader: () => Promise<unknown>) => {
    let value: Promise<unknown> | undefined;
    return () => {
      value ??= reader().catch((error) => {
        value = undefined;
        throw error;
      });
      return value;
    };
  },
}));
jest.mock('@/lib/supabase/publicClient', () => ({
  getOptionalSupabasePublicClient: () => mockGetPublicClient(),
}));
jest.mock('@/lib/gameData/published/buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'legacy-route-cache-test-build',
}));

const query = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
};
const client = {
  from: jest.fn(() => query),
  rpc: jest.fn(),
};

describe('legacy public-actions route cache containment', () => {
  beforeEach(() => {
    mockGetPublicClient.mockReturnValue(client);
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockImplementation((column: string) =>
      column === 'id' ? Promise.resolve({ data: [], error: null }) : query
    );
  });

  it('does not repeat the Supabase query for repeated endpoint requests', async () => {
    await GET();
    await GET();

    expect(client.from).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith('is_public', true);
  });
});
