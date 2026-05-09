import {
  fetchPublicGameDataActions,
  getPublicGameDataActionsAndApplyToServerData,
} from './publicActions';
import type { PublicActionRow } from './publicActionsTypes';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_DISABLE_ARTICLES: '0',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

jest.mock('@/lib/serverCache', () => ({
  cached: (_keyParts: string[], fn: () => Promise<unknown>) => fn(),
}));

const query = {
  select: jest.fn(),
  eq: jest.fn(),
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

describe('public game data actions', () => {
  beforeEach(() => {
    const { characters } = jest.requireMock('@/data') as {
      characters: Record<string, { description: string }>;
    };

    characters.Tom = { description: 'old' };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockResolvedValue({ data: publicRows, error: null });

    const { supabaseServerPublic } = jest.requireMock('@/lib/supabase/public') as {
      supabaseServerPublic: { from: jest.Mock };
    };
    supabaseServerPublic.from.mockReturnValue(query);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all public rows without applying them', async () => {
    const { characters } = jest.requireMock('@/data') as {
      characters: Record<string, { description: string }>;
    };

    await expect(fetchPublicGameDataActions()).resolves.toEqual(publicRows);

    expect(characters.Tom).toEqual({ description: 'old' });
    expect(publicRows.map((row) => row.entity_type)).toEqual(['characters', 'factions', 'unknown']);
  });

  it('should fetch and apply public rows when explicitly requested', async () => {
    const { characters } = jest.requireMock('@/data') as {
      characters: Record<string, { description: string }>;
    };

    await expect(getPublicGameDataActionsAndApplyToServerData()).resolves.toEqual(publicRows);

    expect(characters.Tom).toEqual({ description: 'new' });
  });
});
