import {
  fetchPublicGameDataActions,
  getEntityUpdateHistory,
  getPublicGameDataActionsAndApplyToServerData,
} from './publicActions';
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
  in: jest.fn(),
  order: jest.fn(),
};

jest.mock('@/lib/supabase/public', () => ({
  supabaseServerPublic: {
    from: jest.fn(),
  },
}));

jest.mock('@/data', () => ({
  buffs: {},
  buffsEdit: {},
  cards: {},
  cardsEdit: {},
  characters: {
    Tom: {
      description: 'old',
    },
  },
  entities: {},
  fixtures: {},
  fixturesEdit: {},
  items: {},
  itemsEdit: {},
  maps: {},
  mapsEdit: {},
  modes: {},
  modesEdit: {},
  specialSkills: {},
  specialSkillsEdit: {},
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
    const { characters } = jest.requireMock('@/data') as {
      characters: Record<string, { description: string }>;
    };

    characters.Tom = { description: 'old' };
    queryRows = publicRows;
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.order.mockImplementation((column: string) =>
      column === 'id' ? Promise.resolve({ data: queryRows, error: null }) : query
    );

    const { supabaseServerPublic } = jest.requireMock('@/lib/supabase/public') as {
      supabaseServerPublic: { from: jest.Mock };
    };
    supabaseServerPublic.from.mockReturnValue(query);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all public rows without applying them', async () => {
    const { cached: cachedMock } = jest.requireMock('@/lib/serverCache') as {
      cached: jest.Mock;
    };
    const { characters } = jest.requireMock('@/data') as {
      characters: Record<string, { description: string }>;
    };

    await expect(fetchPublicGameDataActions()).resolves.toEqual(publicRows);

    expect(characters.Tom).toEqual({ description: 'old' });
    expect(publicRows.map((row) => row.entity_type)).toEqual(['characters', 'factions', 'unknown']);
    expect(query.eq).toHaveBeenNthCalledWith(1, 'is_public', true);
    expect(query.eq).toHaveBeenNthCalledWith(2, 'status', 'approved');
    expect(query.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
    expect(cachedMock).toHaveBeenCalledWith(['public-game-data-actions'], expect.any(Function), {
      revalidate: false,
      tags: ['public-game-data-actions'],
    });
  });

  it('should fetch and apply public rows when explicitly requested', async () => {
    const { characters } = jest.requireMock('@/data') as {
      characters: Record<string, { description: string }>;
    };

    await expect(getPublicGameDataActionsAndApplyToServerData()).resolves.toEqual(publicRows);

    expect(characters.Tom).toEqual({ description: 'new' });
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
    expect(query.eq).toHaveBeenCalledWith('is_public', true);
    expect(query.in).toHaveBeenCalledWith('status', ['approved', 'synced']);
    expect(query.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
  });

  it('should retain synced rows in entity update history', async () => {
    queryRows = [
      publicRows[0]!,
      {
        ...publicRows[0]!,
        id: 'synced-character-row',
        created_at: '2026-05-10T00:00:00.000Z',
        status: 'synced',
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
      actionId: 'synced-character-row',
      status: 'synced',
      affectedPath: 'Tom.name',
    });
  });
});
