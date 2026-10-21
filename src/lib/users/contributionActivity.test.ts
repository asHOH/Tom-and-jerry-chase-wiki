/** @jest-environment node */

import {
  calculateContributionMetrics,
  getCachedPublicContributionCalendar,
} from './contributionActivity';

const mockRpc = jest.fn();

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/serverCache', () => ({
  cached: (_key: unknown, reader: () => Promise<unknown>) => reader(),
  MAX_SERVER_CACHE_REVALIDATE_SECONDS: 12 * 60 * 60,
}));
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));
jest.mock('@/lib/supabase/adminClient', () => ({
  getOptionalSupabaseAdminClient: () => ({ rpc: mockRpc }),
}));

it('maps database counts to calendar days used by totals, streaks, and monthly buckets', async () => {
  mockRpc.mockResolvedValueOnce({
    data: [
      { activity_date: '2026-07-31', article_count: 1, game_data_count: 1, total_count: 2 },
      { activity_date: '2026-08-01', article_count: 0, game_data_count: 3, total_count: 3 },
    ],
    error: null,
  });

  const days = await getCachedPublicContributionCalendar('user-id', {
    startDate: '2026-07-31',
    endDate: '2026-08-02',
  });

  expect(days).toEqual([
    { date: '2026-07-31', total: 2, articles: 1, gameData: 1 },
    { date: '2026-08-01', total: 3, articles: 0, gameData: 3 },
    { date: '2026-08-02', total: 0, articles: 0, gameData: 0 },
  ]);
  expect(calculateContributionMetrics(days)).toEqual({
    total: 5,
    activeDays: 2,
    currentStreak: 2,
    longestStreak: 2,
    averagePerActiveDay: 2.5,
    busiestDay: { date: '2026-08-01', count: 3 },
    monthlyBuckets: [
      { month: '2026-07', count: 2, articleCount: 1, gameDataCount: 1 },
      { month: '2026-08', count: 3, articleCount: 0, gameDataCount: 3 },
    ],
  });
});

it('keeps numeric validation and the total fallback when normalizing daily metrics', () => {
  expect(
    calculateContributionMetrics([
      { date: '2026-08-01', total: NaN, articles: -1, gameData: 2.9 },
      { date: '2026-08-02', total: Infinity, articles: NaN, gameData: -1 },
    ])
  ).toMatchObject({
    total: 2,
    activeDays: 1,
    busiestDay: { date: '2026-08-01', count: 2 },
    monthlyBuckets: [{ month: '2026-08', count: 2, articleCount: 0, gameDataCount: 2 }],
  });
});
