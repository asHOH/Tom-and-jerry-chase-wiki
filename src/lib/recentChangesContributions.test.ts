import { GAME_DATA_CONTRIBUTION_FILTER } from '@/lib/gameData/contributionFilter';

import { getRecentChanges } from './recentChanges';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  unstable_cache: (callback: unknown) => callback,
  updateTag: jest.fn(),
}));

jest.mock('@/lib/serverCache', () => ({
  cached: jest.fn((_keyParts: string[], fn: () => Promise<unknown>) => fn()),
}));

jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: {
    articles: 'articles',
  },
}));

jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));

jest.mock('@/lib/supabase/config', () => ({
  hasSupabasePublicConfig: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  hasSupabaseAdminConfig: jest.fn(),
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/public', () => ({
  supabaseServerPublic: {
    from: jest.fn(),
  },
}));

function createThenableQuery<T>(result: T) {
  const query = {
    select: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    in: jest.fn(),
    then: jest.fn((resolve: (value: T) => unknown) => Promise.resolve(resolve(result))),
  };

  query.select.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockReturnValue(query);
  query.in.mockReturnValue(query);

  return query;
}

const { hasSupabasePublicConfig } = jest.requireMock('@/lib/supabase/config') as {
  hasSupabasePublicConfig: jest.Mock;
};
const { hasSupabaseAdminConfig, supabaseAdmin } = jest.requireMock('@/lib/supabase/admin') as {
  hasSupabaseAdminConfig: jest.Mock;
  supabaseAdmin: {
    from: jest.Mock;
  };
};
const { supabaseServerPublic } = jest.requireMock('@/lib/supabase/public') as {
  supabaseServerPublic: {
    from: jest.Mock;
  };
};

describe('recent changes contribution queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasSupabasePublicConfig.mockReturnValue(true);
    hasSupabaseAdminConfig.mockReturnValue(true);
  });

  it('includes synced game-data rows as contributions and prefers the admin reader when available', async () => {
    const countQuery = createThenableQuery({ count: 1, error: null });
    const rowsQuery = createThenableQuery({
      data: [
        {
          id: 'synced-1',
          entity_type: 'characters',
          entry: { op: 'set', path: '汤姆.description', value: '更新' },
          message: '同步到基线',
          created_at: '2026-07-25T01:00:00Z',
          created_by: 'user-1',
        },
      ],
      error: null,
    });
    const usersQuery = createThenableQuery({
      data: [{ id: 'user-1', nickname: '编辑者' }],
      error: null,
    });

    supabaseAdmin.from
      .mockImplementationOnce(() => countQuery)
      .mockImplementationOnce(() => rowsQuery)
      .mockImplementationOnce(() => usersQuery);

    const result = await getRecentChanges('game-data', 1);

    expect(result).toMatchObject({
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      changes: [
        expect.objectContaining({
          id: 'synced-1',
          kind: 'gameData',
          title: '更新角色：汤姆',
          editor: { id: 'user-1', nickname: '编辑者' },
        }),
      ],
    });
    expect(countQuery.or).toHaveBeenCalledWith(GAME_DATA_CONTRIBUTION_FILTER);
    expect(rowsQuery.or).toHaveBeenCalledWith(GAME_DATA_CONTRIBUTION_FILTER);
    expect(supabaseServerPublic.from).not.toHaveBeenCalled();
  });
});
