import { getApprovedActionSnapshot } from './getApprovedActionSnapshot';

const mockCached = jest.fn(
  async (_key: unknown, callback: () => Promise<unknown>, _options: unknown) => callback()
);
const mockQueryApprovedRows = jest.fn();

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (callback: unknown) => callback,
}));
jest.mock('@/lib/serverCache', () => ({
  cached: (...args: unknown[]) => mockCached(...(args as Parameters<typeof mockCached>)),
}));
jest.mock('@/lib/gameData/publicActionQueries', () => ({
  queryApprovedPublicActionRows: (...args: unknown[]) => mockQueryApprovedRows(...args),
}));
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS: 3600,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));
jest.mock('@/lib/supabase/config', () => ({
  hasSupabasePublicConfig: () => true,
}));
jest.mock('@/lib/supabase/public', () => ({
  supabaseServerPublic: { from: jest.fn() },
}));
jest.mock('./buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'snapshot-test-build',
}));

describe('getApprovedActionSnapshot', () => {
  it('uses the shared action tag and build-keyed persistent row cache', async () => {
    mockQueryApprovedRows.mockResolvedValue([
      {
        id: 'snapshot-row',
        entity_type: 'items',
        entry: { op: 'set', path: '火箭.description', newValue: '发布值' },
        created_at: '2026-07-24T00:00:00.000Z',
        status: 'approved',
        created_by: null,
        message: null,
        reviewed_at: null,
      },
    ]);

    const snapshot = await getApprovedActionSnapshot();

    expect(snapshot.rows).toHaveLength(1);
    expect(snapshot.rows[0]?.actions[0]).toMatchObject({
      op: 'set',
      path: '火箭.description',
      newValue: '发布值',
    });
    expect(mockCached).toHaveBeenCalledWith(
      ['public-game-data-actions', 'approved-snapshot', 'v1', 'snapshot-test-build'],
      expect.any(Function),
      {
        revalidate: 3600,
        tags: ['public-game-data-actions'],
      }
    );
  });
});
