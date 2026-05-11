import { waitFor } from '@testing-library/react';

import { characters, items, itemsEdit } from '@/data';

import { getActionsStorageKey, readActionHistory } from './diffUtils';
import {
  clearAllEditModeData,
  getEntityRegistry,
  loadEntitiesFromStorage,
  PUBLISHABLE_ENTITY_TYPES,
  setupEntitySubscribers,
  teardownSubscribers,
} from './editModeRegistry';

const TEST_CHARACTER_ID = '__edit_mode_registry_character__';

describe('editModeRegistry', () => {
  let characterSnapshot: Record<string, unknown>;
  let itemSnapshot: Record<string, unknown>;

  beforeEach(() => {
    characterSnapshot = structuredClone(characters) as Record<string, unknown>;
    itemSnapshot = structuredClone(itemsEdit) as Record<string, unknown>;
    window.localStorage.clear();
    teardownSubscribers();
  });

  afterEach(() => {
    teardownSubscribers();
    Object.keys(characters).forEach((key) => {
      delete (characters as Record<string, unknown>)[key];
    });
    Object.entries(characterSnapshot).forEach(([key, value]) => {
      (characters as Record<string, unknown>)[key] = value;
    });
    Object.keys(itemsEdit).forEach((key) => {
      delete (itemsEdit as Record<string, unknown>)[key];
    });
    Object.entries(itemSnapshot).forEach(([key, value]) => {
      (itemsEdit as Record<string, unknown>)[key] = value;
    });
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('should expose all publishable entity registries', () => {
    expect(PUBLISHABLE_ENTITY_TYPES).toEqual([
      'characters',
      'factions',
      'cards',
      'entities',
      'buffs',
      'items',
      'fixtures',
      'maps',
      'modes',
      'specialSkills',
      'achievements',
    ]);
    expect(getEntityRegistry().get('characters')).toBe(characters);
    expect(getEntityRegistry().get('items')).toBe(itemsEdit);
  });

  it('should load stored draft actions into registered entity stores', () => {
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

    loadEntitiesFromStorage();

    expect((characters as Record<string, { description?: string }>)[TEST_CHARACTER_ID]).toEqual({
      description: 'registry restored draft',
    });
  });

  it('should record registered entity mutations while subscribers are set up', async () => {
    setupEntitySubscribers();

    (characters as Record<string, { description: string }>)[TEST_CHARACTER_ID] = {
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

  it('should clear draft storage and restore editable stores to canonical data', () => {
    const itemId = Object.keys(items)[0]!;
    window.localStorage.setItem('items', 'legacy draft');
    window.localStorage.setItem(getActionsStorageKey('items'), '[]');
    (itemsEdit as Record<string, unknown>)[itemId] = {
      name: 'mutated item',
    };

    clearAllEditModeData();

    expect(window.localStorage.getItem('items')).toBeNull();
    expect(window.localStorage.getItem(getActionsStorageKey('items'))).toBeNull();
    expect((itemsEdit as Record<string, { name?: string }>)[itemId]?.name).toBe(
      (items as Record<string, { name?: string }>)[itemId]?.name
    );
  });
});
