import { subscribe, unstable_enableOp } from 'valtio';
import { proxy } from 'valtio/vanilla';

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
import type { EditStores } from '@/lib/edit/editStores';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { storage } from '@/lib/localStorage';

unstable_enableOp(true);

const DRAFT_HISTORY_WARNING_THRESHOLD = 1000;

export class EditDraftRestoreError extends Error {
  readonly causes: readonly unknown[];

  constructor(causes: readonly unknown[]) {
    super('Failed to restore one or more edit-mode drafts.');
    this.name = 'EditDraftRestoreError';
    this.causes = causes;
  }
}

export type EditModeRegistry = Readonly<{
  entityRegistry: ReadonlyMap<PublishableEntityType, Record<string, unknown>>;
  setupSubscribers: () => void;
  teardownSubscribers: () => void;
  loadDrafts: () => void;
  clearAllData: () => void;
}>;

function asRecord(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function createEntityRegistry(
  stores: EditStores
): Map<PublishableEntityType, Record<string, unknown>> {
  return new Map([
    ['achievements', asRecord(stores.achievements)],
    ['characters', asRecord(stores.characters)],
    ['cards', asRecord(stores.cards)],
    ['entities', asRecord(stores.entities)],
    ['buffs', asRecord(stores.buffs)],
    ['items', asRecord(stores.items)],
    ['fixtures', asRecord(stores.fixtures)],
    ['maps', asRecord(stores.maps)],
    ['modes', asRecord(stores.modes)],
    ['specialSkills', asRecord(stores.specialSkills)],
    ['traits', asRecord(stores.traits)],
  ]);
}

function syncEntityToLocalStorage(
  entityType: PublishableEntityType,
  entity: Record<string, unknown>
): () => void {
  const actionsStorageKey = getActionsStorageKey(entityType);

  return subscribe(entity, (ops) => {
    const actions = actionsFromValtioOps(ops);
    if (actions.length === 0) return;
    appendActionHistoryEntry(actionsStorageKey, actions.length === 1 ? actions[0]! : actions);
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
  source: Readonly<Record<string, unknown>>
): void {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });

  Object.entries(source).forEach(([key, value]) => {
    target[key] = createEditableProxyValue(value);
  });
}

export function createEditModeRegistry(
  stores: EditStores,
  baseline: PublishedGameDataByType
): EditModeRegistry {
  const entityRegistry = createEntityRegistry(stores);

  const teardownSubscribers = (): void => {
    Object.keys(subscribers).forEach((key) => {
      const entry = subscribers[key];
      const unsubscribe = entry?.[1];
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      delete subscribers[key];
    });
  };

  const setupSubscribers = (): void => {
    entityRegistry.forEach((entity, entityType) => {
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
  };

  const loadDrafts = (): void => {
    if (typeof window === 'undefined') return;

    const errors: unknown[] = [];
    entityRegistry.forEach((entity, entityType) => {
      try {
        const actionsStorageKey = getActionsStorageKey(entityType);
        const history = readActionHistory(actionsStorageKey);
        if (history.length === 0) return;

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
      } catch (error) {
        console.error(`Failed to load ${entityType} from localStorage:`, error);
        errors.push(error);
      }
    });

    if (errors.length > 0) {
      throw new EditDraftRestoreError(errors);
    }
  };

  const clearActionHistoriesFromStorage = (): void => {
    if (typeof window === 'undefined') return;

    entityRegistry.forEach((_entity, entityType) => {
      const removedEntity = storage.removeItem(entityType);
      const removedActions = storage.removeItem(getActionsStorageKey(entityType));
      if (!removedEntity || !removedActions) {
        console.error(`Failed to clear ${entityType} from localStorage.`);
      }
    });
  };

  const restoreBaseline = (): void => {
    teardownSubscribers();
    try {
      entityRegistry.forEach((entity, entityType) => {
        replaceProxyRecord(
          entity,
          baseline[entityType] as unknown as Readonly<Record<string, unknown>>
        );
      });
      GameDataManager.invalidate();
    } finally {
      setupSubscribers();
    }
  };

  return Object.freeze({
    entityRegistry,
    setupSubscribers,
    teardownSubscribers,
    loadDrafts,
    clearAllData: () => {
      clearActionHistoriesFromStorage();
      restoreBaseline();
    },
  });
}
