import { subscribe, unstable_enableOp } from 'valtio';

import {
  actionsFromValtioOps,
  applyActionEntry,
  normalizeActionHistory,
  type ActionHistoryEntry,
} from '@/lib/edit/diffUtils';
import type { EditStores } from '@/lib/edit/editStores';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { getEditModeActionsStorageKey, storage } from '@/lib/localStorage';
import { actionHistorySchema } from '@/lib/validation/schemas';

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

type EditModeRegistry = Readonly<{
  setupSubscribers: () => void;
  teardownSubscribers: () => void;
  loadDrafts: () => void;
  withRecordingSuppressed: <T>(entityType: PublishableEntityType, fn: () => T) => T;
}>;

export type EditHistoryStore = Readonly<{
  read: (entityType: PublishableEntityType) => ActionHistoryEntry[];
  append: (entityType: PublishableEntityType, entry: ActionHistoryEntry) => void;
  replace: (entityType: PublishableEntityType, history: ActionHistoryEntry[]) => boolean;
}>;

export const browserEditHistoryStore: EditHistoryStore = Object.freeze({
  read: (entityType) => {
    const parsed = actionHistorySchema.safeParse(
      storage.getJson<unknown>(getEditModeActionsStorageKey(entityType))
    );
    return parsed.success ? normalizeActionHistory(parsed.data as ActionHistoryEntry[]) : [];
  },
  append: (entityType, entry) => {
    const history = browserEditHistoryStore.read(entityType);
    storage.setJson(
      getEditModeActionsStorageKey(entityType),
      normalizeActionHistory([...history, entry])
    );
  },
  replace: (entityType, history) =>
    history.length === 0
      ? storage.removeItem(getEditModeActionsStorageKey(entityType))
      : storage.setJson(getEditModeActionsStorageKey(entityType), history),
});

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
  entity: Record<string, unknown>,
  historyStore: EditHistoryStore
): () => void {
  return subscribe(entity, (ops) => {
    const actions = actionsFromValtioOps(ops);
    if (actions.length === 0) return;
    historyStore.append(entityType, actions.length === 1 ? actions[0]! : actions);
  });
}

export function createEditModeRegistry(
  stores: EditStores,
  historyStore: EditHistoryStore = browserEditHistoryStore
): EditModeRegistry {
  const entityRegistry = createEntityRegistry(stores);
  const subscribers = new Map<PublishableEntityType, () => void>();

  const subscribeEntity = (
    entityType: PublishableEntityType,
    entity: Record<string, unknown>
  ): void => {
    subscribers.get(entityType)?.();
    subscribers.set(entityType, syncEntityToLocalStorage(entityType, entity, historyStore));
  };

  const teardownSubscribers = (): void => {
    subscribers.forEach((unsubscribe) => unsubscribe());
    subscribers.clear();
  };

  const setupSubscribers = (): void => {
    entityRegistry.forEach((entity, entityType) => {
      subscribeEntity(entityType, entity);
    });
  };

  const withRecordingSuppressed: EditModeRegistry['withRecordingSuppressed'] = (entityType, fn) => {
    const entity = entityRegistry.get(entityType);
    const unsubscribe = subscribers.get(entityType);
    if (!entity || !unsubscribe) return fn();

    unsubscribe();
    subscribers.delete(entityType);
    try {
      return fn();
    } finally {
      subscribeEntity(entityType, entity);
    }
  };

  const loadDrafts = (): void => {
    if (typeof window === 'undefined') return;

    const errors: unknown[] = [];
    entityRegistry.forEach((entity, entityType) => {
      try {
        const history = historyStore.read(entityType);
        if (history.length === 0) return;

        if (history.length > DRAFT_HISTORY_WARNING_THRESHOLD) {
          console.warn('Large edit mode draft history detected', {
            entityType,
            entries: history.length,
            threshold: DRAFT_HISTORY_WARNING_THRESHOLD,
          });
        }

        withRecordingSuppressed(entityType, () => {
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

  return Object.freeze({
    setupSubscribers,
    teardownSubscribers,
    loadDrafts,
    withRecordingSuppressed,
  });
}
