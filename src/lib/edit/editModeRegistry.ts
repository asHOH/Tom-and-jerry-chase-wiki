import { proxy, subscribe, unstable_enableOp } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import {
  actionsFromValtioOps,
  appendActionHistoryEntry,
  applyActionEntry,
  getActionsStorageKey,
  readActionHistory,
  subscribers,
  withRecordingSuppressed,
} from '@/lib/edit/diffUtils';
import {
  achievements,
  achievementsEdit,
  buffs,
  buffsEdit,
  cardsEdit,
  characters,
  entities,
  entitiesEdit,
  fixtures,
  fixturesEdit,
  items,
  itemsEdit,
  maps,
  mapsEdit,
  modes,
  modesEdit,
  specialSkills,
  specialSkillsEdit,
} from '@/data';

export const PUBLISHABLE_ENTITY_TYPES = [
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
] as const;

export type PublishableEntityType = (typeof PUBLISHABLE_ENTITY_TYPES)[number];

unstable_enableOp(true);

/**
 * Entity registry mapping entity types to their proxy objects.
 */
export const entityRegistry = new Map<string, Record<string, unknown>>([
  ['achievements', achievementsEdit as unknown as Record<string, unknown>],
  ['characters', characters],
  ['cards', cardsEdit],
  ['entities', entitiesEdit as unknown as Record<string, unknown>],
  ['buffs', buffsEdit as unknown as Record<string, unknown>],
  ['items', itemsEdit as unknown as Record<string, unknown>],
  ['fixtures', fixturesEdit as unknown as Record<string, unknown>],
  ['maps', mapsEdit as unknown as Record<string, unknown>],
  ['modes', modesEdit as unknown as Record<string, unknown>],
  ['specialSkills', specialSkillsEdit as unknown as Record<string, unknown>],
]);

const DRAFT_HISTORY_WARNING_THRESHOLD = 1000;

/**
 * Centralized localStorage sync helper.
 * Subscribes to entity changes and persists them to localStorage.
 */
function syncEntityToLocalStorage(entityType: string, entity: Record<string, unknown>): () => void {
  const actionsStorageKey = getActionsStorageKey(entityType);

  return subscribe(entity, (ops) => {
    const actions = actionsFromValtioOps(ops);
    if (actions.length === 0) return;
    appendActionHistoryEntry(actionsStorageKey, actions.length === 1 ? actions[0]! : actions);
  });
}

export function setupEntitySubscribers(): void {
  Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
    const key = getActionsStorageKey(entityType);
    const existing = subscribers[key];
    const unsubscribe = existing?.[1];
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }

    subscribers[key] = [
      () => {
        subscribers[key]![1] = syncEntityToLocalStorage(entityType, entity);
      },
      void 0 as unknown as () => void,
    ];
    subscribers[key][0]();
  });
}

export function teardownSubscribers(): void {
  Object.keys(subscribers).forEach((key) => {
    const entry = subscribers[key];
    const unsubscribe = entry?.[1];
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
    delete subscribers[key];
  });
}

/**
 * Loads all registered entities from localStorage action history.
 * Called when entering edit mode to restore previous session.
 */
export function loadEntitiesFromStorage(): void {
  if (typeof localStorage === 'undefined') return;

  Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
    try {
      const actionsStorageKey = getActionsStorageKey(entityType);
      const history = readActionHistory(actionsStorageKey);
      if (history.length > 0) {
        if (history.length > DRAFT_HISTORY_WARNING_THRESHOLD) {
          console.warn('Large edit mode draft history detected', {
            entityType,
            entries: history.length,
            threshold: DRAFT_HISTORY_WARNING_THRESHOLD,
          });
        }

        withRecordingSuppressed(actionsStorageKey, () => {
          for (const entry of history) {
            applyActionEntry(entity, entry);
          }
        });
      }
    } catch (error) {
      console.error(`Failed to load ${entityType} from localStorage:`, error);
    }
  });
}

/**
 * Clears all action histories from localStorage.
 */
function clearActionHistoriesFromStorage(): void {
  if (typeof localStorage === 'undefined') return;

  Array.from(entityRegistry.entries()).forEach(([entityType]) => {
    try {
      localStorage.removeItem(entityType);
      localStorage.removeItem(getActionsStorageKey(entityType));
    } catch (error) {
      console.error(`Failed to clear ${entityType} from localStorage:`, error);
    }
  });
}

function createEditableProxyValue(value: unknown): unknown {
  if (typeof value === 'object' && value !== null) {
    return proxy(structuredClone(value as Record<string, unknown>));
  }
  return value;
}

function replaceProxyRecord(
  target: Record<string, unknown>,
  source: Record<string, unknown> | Readonly<Record<string, unknown>>
): void {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });

  Object.entries(source).forEach(([key, value]) => {
    target[key] = createEditableProxyValue(value);
  });
}

/**
 * Restores all registered entities to their original canonical state.
 */
function restoreEntitiesToCanonical(): void {
  GameDataManager.invalidate({ characters: true, cards: true });

  const canonicalRecordSources: Partial<Record<PublishableEntityType, Record<string, unknown>>> = {
    achievements: achievements as Record<string, unknown>,
    buffs: buffs as Record<string, unknown>,
    cards: GameDataManager.getCards() as Record<string, unknown>,
    characters: GameDataManager.getCharacters() as Record<string, unknown>,
    entities: {
      ...entities.cat,
      ...entities.mouse,
    } as Record<string, unknown>,
    fixtures: fixtures as Record<string, unknown>,
    items: items as Record<string, unknown>,
    maps: maps as Record<string, unknown>,
    modes: modes as Record<string, unknown>,
  };

  Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
    if (entityType === 'specialSkills') {
      const root = entity as unknown as {
        cat?: Record<string, unknown>;
        mouse?: Record<string, unknown>;
      };

      if (!root.cat) root.cat = {};
      if (!root.mouse) root.mouse = {};

      replaceProxyRecord(root.cat, specialSkills.cat as Record<string, unknown>);
      replaceProxyRecord(root.mouse, specialSkills.mouse as Record<string, unknown>);
      return;
    }

    const source = canonicalRecordSources[entityType as PublishableEntityType];
    if (source) {
      replaceProxyRecord(entity, source);
    }
  });

  GameDataManager.invalidate();
}

/**
 * Clears all action histories and restores canonical data.
 * Call this when the user explicitly discards all changes.
 */
export function clearAllEditModeData(): void {
  clearActionHistoriesFromStorage();
  restoreEntitiesToCanonical();
}

/**
 * Get entity registry for external access (e.g., for bulk operations).
 */
export function getEntityRegistry(): Map<string, Record<string, unknown>> {
  return entityRegistry;
}
