import { GAME_DATA_CONTRIBUTION_FILTER } from '@/lib/gameData/contributionFilter';

import { getPublicUserProfile, mergeRecentContributions } from './publicProfile';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/supabase/admin', () => ({
  hasSupabaseAdminConfig: jest.fn(),
  supabaseAdmin: {
    from: jest.fn(),
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
    },
  },
}));

function createThenableQuery<T>(result: T) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    neq: jest.fn(),
    not: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    then: jest.fn((resolve: (value: T) => unknown) => Promise.resolve(resolve(result))),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.neq.mockReturnValue(query);
  query.not.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);

  return query;
}

function createMaybeSingleQuery<T>(result: T) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue(result);

  return query;
}

const { hasSupabaseAdminConfig, supabaseAdmin } = jest.requireMock('@/lib/supabase/admin') as {
  hasSupabaseAdminConfig: jest.Mock;
  supabaseAdmin: {
    from: jest.Mock;
    auth: {
      admin: {
        getUserById: jest.Mock;
      };
    };
  };
};

describe('mergeRecentContributions', () => {
  it('merges both contribution sources in reverse chronological order', () => {
    expect(
      mergeRecentContributions(
        [
          {
            id: 'article-version',
            article_id: 'article',
            commit_message: '补充说明',
            created_at: '2026-07-16T08:00:00Z',
            articles: { title: '测试文章' },
          },
        ],
        [
          {
            id: 'game-data-action',
            entity_type: 'characters',
            message: '修正数值',
            created_at: '2026-07-17T08:00:00Z',
          },
        ]
      )
    ).toEqual([
      {
        id: 'game-data-action',
        kind: 'gameData',
        title: '更新角色',
        description: '修正数值',
        href: null,
        createdAt: '2026-07-17T08:00:00Z',
      },
      {
        id: 'article-version',
        kind: 'article',
        title: '编辑《测试文章》',
        description: '补充说明',
        href: '/articles/article/history',
        createdAt: '2026-07-16T08:00:00Z',
      },
    ]);
  });

  it('applies the requested limit', () => {
    const rows = Array.from({ length: 3 }, (_, index) => ({
      id: `action-${index}`,
      entity_type: 'unknown',
      message: null,
      created_at: `2026-07-1${index + 1}T08:00:00Z`,
    }));

    expect(mergeRecentContributions([], rows, 2)).toHaveLength(2);
  });

  it('counts synced game-data rows as contributions even after they leave the replay set', async () => {
    hasSupabaseAdminConfig.mockReturnValue(true);
    supabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { created_at: '2026-07-01T00:00:00Z' } },
      error: null,
    });

    const membershipsQuery = createThenableQuery({ data: [], error: null });
    const articleCountQuery = createThenableQuery({ count: 1, error: null });
    const gameDataCountQuery = createThenableQuery({ count: 2, error: null });
    const reviewCountQuery = createThenableQuery({ count: 0, error: null });
    const articleRowsQuery = createThenableQuery({ data: [], error: null });
    const gameDataRowsQuery = createThenableQuery({
      data: [
        {
          id: 'synced-action',
          entity_type: 'characters',
          message: '已同步',
          created_at: '2026-07-20T00:00:00Z',
        },
      ],
      error: null,
    });

    supabaseAdmin.from
      .mockImplementationOnce(() =>
        createMaybeSingleQuery({
          data: { id: 'user-1', nickname: '测试用户' },
          error: null,
        })
      )
      .mockImplementationOnce(() => membershipsQuery)
      .mockImplementationOnce(() => articleCountQuery)
      .mockImplementationOnce(() => gameDataCountQuery)
      .mockImplementationOnce(() => reviewCountQuery)
      .mockImplementationOnce(() => articleRowsQuery)
      .mockImplementationOnce(() => gameDataRowsQuery);

    const profile = await getPublicUserProfile('user-1');

    expect(profile).toMatchObject({
      id: 'user-1',
      contributionTotals: {
        articles: 1,
        gameData: 2,
        all: 3,
      },
      recentContributions: [
        expect.objectContaining({
          id: 'synced-action',
          kind: 'gameData',
          title: '更新角色',
        }),
      ],
    });
    expect(gameDataCountQuery.or).toHaveBeenCalledWith(GAME_DATA_CONTRIBUTION_FILTER);
    expect(gameDataRowsQuery.or).toHaveBeenCalledWith(GAME_DATA_CONTRIBUTION_FILTER);
  });
});
