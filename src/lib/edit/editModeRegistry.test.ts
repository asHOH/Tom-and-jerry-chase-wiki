import { waitFor } from '@testing-library/react';

import { createEditStores, type EditStores } from '@/lib/edit/editStores';
import { PUBLISHABLE_ENTITY_TYPES } from '@/lib/gameData/publishableEntityTypes';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
  traits,
} from '@/data/static';

import { getActionsStorageKey, readActionHistory } from './diffUtils';
import { createEditModeRegistry, type EditModeRegistry } from './editModeRegistry';

const TEST_CHARACTER_ID = '__edit_mode_registry_character__';
const baseline = {
  achievements,
  characters,
  cards,
  entities,
  buffs,
  items,
  fixtures,
  maps,
  modes,
  specialSkills,
  traits,
} as PublishedGameDataByType;

describe('editModeRegistry', () => {
  let stores: EditStores;
  let registry: EditModeRegistry;

  beforeEach(() => {
    stores = createEditStores(baseline);
    registry = createEditModeRegistry(stores, baseline);
    window.localStorage.clear();
  });

  afterEach(() => {
    registry.teardownSubscribers();
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('exposes all publishable entity registries from one store set', () => {
    expect([...registry.entityRegistry.keys()].sort()).toEqual(
      [...PUBLISHABLE_ENTITY_TYPES].sort()
    );
    expect(registry.entityRegistry.get('characters')).toBe(stores.characters);
    expect(registry.entityRegistry.get('items')).toBe(stores.items);
  });

  it('loads stored draft actions before subscribers start', () => {
    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: undefined,
          newValue: 'registry restored draft',
        },
      ])
    );

    registry.loadDrafts();

    expect(
      (stores.characters as Record<string, { description?: string }>)[TEST_CHARACTER_ID]
    ).toEqual({
      description: 'registry restored draft',
    });
  });

  it('records registered entity mutations after subscribers start', async () => {
    registry.setupSubscribers();

    (stores.characters as Record<string, { description: string }>)[TEST_CHARACTER_ID] = {
      description: 'registry recorded draft',
    };

    await waitFor(() => {
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([
        expect.objectContaining({
          op: 'set',
          path: TEST_CHARACTER_ID,
          newValue: { description: 'registry recorded draft' },
        }),
      ]);
    });
  });

  it('clears draft storage and restores the fixed published baseline', () => {
    const itemId = Object.keys(items)[0]!;
    window.localStorage.setItem('items', 'legacy draft');
    window.localStorage.setItem(getActionsStorageKey('items'), '[]');
    (stores.items as Record<string, unknown>)[itemId] = {
      name: 'mutated item',
    };

    registry.clearAllData();

    expect(window.localStorage.getItem('items')).toBeNull();
    expect(window.localStorage.getItem(getActionsStorageKey('items'))).toBeNull();
    expect((stores.items as Record<string, { name?: string }>)[itemId]?.name).toBe(
      (items as Record<string, { name?: string }>)[itemId]?.name
    );
  });

  it('does not record restore mutations when clearing all edit mode data', () => {
    registry.setupSubscribers();

    registry.clearAllData();

    expect(readActionHistory(getActionsStorageKey('items'))).toEqual([]);
    expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([]);
  });
});
