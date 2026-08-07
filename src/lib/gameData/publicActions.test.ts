import { GAME_DATA_CONTRIBUTION_FILTER } from './contributionFilter';
import { fetchPublicGameDataActions, getEntityUpdateHistory } from './publicActions';
import type { PublicActionRow } from './publicActionsTypes';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_DISABLE_ARTICLES: '0',
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  },
}));

jest.mock('@/lib/serverCache', () => ({
  cached: jest.fn((_keyParts: string[], fn: () => Promise<unknown>) => fn()),
}));

jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));

const query = {
  select: jest.fn(),
  eq: jest.fn(),
  or: jest.fn(),
  order: jest.fn(),
};

jest.mock('@/lib/supabase/public', () => ({
  supabaseServerPublic: {
    from: jest.fn(),
  },
}));

const publicRows: PublicActionRow[] = [
  {
    id: 'character-row',
    entity_type: 'characters',
    entry: {
      op: 'set',
      path: 'Tom.description',
      oldValue: 'old',
      newValue: 'new',
    },
    created_at: '2026-05-09T00:00:00.000Z',
    status: 'approved',
    message: null,
    reviewed_at: null,
    created_by: null,
  },
  {
    id: 'factions-row',
    entity_type: 'factions',
    entry: {
      op: 'set',
      path: 'cat.description',
      oldValue: 'old',
      newValue: 'new',
    },
    created_at: '2026-05-09T00:01:00.000Z',
    status: 'approved',
    message: null,
    reviewed_at: null,
    created_by: null,
  },
  {
    id: 'unknown-row',
    entity_type: 'unknown',
    entry: {
      op: 'set',
      path: 'Unknown.description',
      oldValue: 'old',
      newValue: 'new',
    },
    created_at: '2026-05-09T00:02:00.000Z',
    status: 'approved',
    message: null,
    reviewed_at: null,
    created_by: null,
  },
];

let queryRows = publicRows;

describe('public game data actions', () => {
  beforeEach(() => {
    const { cached: cachedMock } = jest.requireMock('@/lib/serverCache') as {
      cached: jest.Mock;
    };
    cachedMock.mockImplementation((_keyParts: string[], fn: () => Promise<unknown>) => fn());
    queryRows = publicRows;
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.or.mockReturnValue(query);
    query.order.mockImplementation((column: string) =>
      column === 'id' ? Promise.resolve({ data: queryRows, error: null }) : query
    );

    const { supabaseServerPublic } = jest.requireMock('@/lib/supabase/public') as {
      supabaseServerPublic: { from: jest.Mock };
    };
    supabaseServerPublic!.from.mockReturnValue(query);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all public rows without applying them', async () => {
    const { cached: cachedMock } = jest.requireMock('@/lib/serverCache') as {
      cached: jest.Mock;
    };
    await expect(fetchPublicGameDataActions()).resolves.toEqual(publicRows);

    expect(publicRows.map((row) => row.entity_type)).toEqual(['characters', 'factions', 'unknown']);
    expect(query.eq).toHaveBeenNthCalledWith(1, 'is_public', true);
    expect(query.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
    expect(cachedMock).toHaveBeenCalledWith(['public-game-data-actions'], expect.any(Function), {
      revalidate: false,
      tags: ['public-game-data-actions'],
    });
  });

  it('should retry the approved-row query after a transient cached query failure', async () => {
    const { cached: cachedMock } = jest.requireMock('@/lib/serverCache') as {
      cached: jest.Mock;
    };
    let hasCachedValue = false;
    let cachedValue: unknown;
    cachedMock.mockImplementation(
      async (_keyParts: string[], fn: () => Promise<unknown>): Promise<unknown> => {
        if (hasCachedValue) return cachedValue;
        const value = await fn();
        cachedValue = value;
        hasCachedValue = true;
        return value;
      }
    );

    let terminalQueryCount = 0;
    query.order.mockImplementation((column: string) => {
      if (column !== 'id') return query;
      terminalQueryCount += 1;
      return Promise.resolve(
        terminalQueryCount === 1
          ? { data: null, error: { message: 'temporary query failure' } }
          : { data: queryRows, error: null }
      );
    });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(fetchPublicGameDataActions()).resolves.toEqual([]);
    await expect(fetchPublicGameDataActions()).resolves.toEqual(publicRows);

    expect(terminalQueryCount).toBe(2);
    expect(consoleError).toHaveBeenCalledWith('Error fetching public game data actions:', {
      message: 'temporary query failure',
    });
    consoleError.mockRestore();
  });

  it('should use the action id to break update-history timestamp ties', async () => {
    queryRows = [
      {
        ...publicRows[0]!,
        id: '00000000-0000-4000-8000-000000000001',
        entry: {
          op: 'set',
          path: 'Tom.description',
          oldValue: 'old',
          newValue: 'first',
        },
      },
      {
        ...publicRows[0]!,
        id: '00000000-0000-4000-8000-000000000002',
        entry: {
          op: 'set',
          path: 'Tom.name',
          oldValue: 'Tom',
          newValue: 'Thomas',
        },
      },
    ];

    const history = await getEntityUpdateHistory();

    expect(history.get('characters:Tom')).toMatchObject({
      actionId: '00000000-0000-4000-8000-000000000002',
      affectedPath: 'Tom.name',
    });
    expect(query.or).toHaveBeenCalledWith(GAME_DATA_CONTRIBUTION_FILTER);
    expect(query.eq).not.toHaveBeenCalled();
    expect(query.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
  });

  it('should retain public pending rows in entity update history', async () => {
    queryRows = [
      publicRows[0]!,
      {
        ...publicRows[0]!,
        id: 'public-pending-character-row',
        created_at: '2026-05-10T00:00:00.000Z',
        status: 'pending',
        entry: {
          op: 'set',
          path: 'Tom.name',
          oldValue: 'Tom',
          newValue: 'Thomas',
        },
      },
    ];

    const history = await getEntityUpdateHistory();

    expect(history.get('characters:Tom')).toMatchObject({
      actionId: 'public-pending-character-row',
      status: 'pending',
      affectedPath: 'Tom.name',
    });
  });

  it('should keep faction-scoped achievement and special-skill history keys', async () => {
    queryRows = [
      {
        ...publicRows[0]!,
        id: 'achievement-row',
        entity_type: 'achievements',
        entry: {
          op: 'set',
          path: 'cat.翻盘.description',
          oldValue: 'old',
          newValue: 'new',
        },
      },
      {
        ...publicRows[0]!,
        id: 'special-skill-row',
        entity_type: 'specialSkills',
        entry: {
          op: 'set',
          path: 'mouse.急速翻滚.cooldown',
          oldValue: 1,
          newValue: 2,
        },
      },
    ];

    const history = await getEntityUpdateHistory();

    expect(history.get('achievements:cat.翻盘')).toMatchObject({
      actionId: 'achievement-row',
      affectedPath: 'cat.翻盘.description',
    });
    expect(history.get('specialSkills:mouse.急速翻滚')).toMatchObject({
      actionId: 'special-skill-row',
      affectedPath: 'mouse.急速翻滚.cooldown',
    });
  });

  it('should retry the history query after a transient cached query failure', async () => {
    const { cached: cachedMock } = jest.requireMock('@/lib/serverCache') as {
      cached: jest.Mock;
    };
    let hasCachedValue = false;
    let cachedValue: unknown;
    cachedMock.mockImplementation(
      async (_keyParts: string[], fn: () => Promise<unknown>): Promise<unknown> => {
        if (hasCachedValue) return cachedValue;
        const value = await fn();
        cachedValue = value;
        hasCachedValue = true;
        return value;
      }
    );

    let terminalQueryCount = 0;
    query.order.mockImplementation((column: string) => {
      if (column !== 'id') return query;
      terminalQueryCount += 1;
      return Promise.resolve(
        terminalQueryCount === 1
          ? { data: null, error: { message: 'temporary history failure' } }
          : { data: queryRows, error: null }
      );
    });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(getEntityUpdateHistory()).resolves.toEqual(new Map());
    const history = await getEntityUpdateHistory();

    expect(history.get('characters:Tom')).toMatchObject({ actionId: 'character-row' });
    expect(terminalQueryCount).toBe(2);
    expect(consoleError).toHaveBeenCalledWith('Error fetching public game data action history:', {
      message: 'temporary history failure',
    });
    consoleError.mockRestore();
  });
});
