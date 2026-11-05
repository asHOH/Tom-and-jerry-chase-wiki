import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { getEditModeActionsStorageKey, storage } from '@/lib/localStorage';
import { actionHistorySchema } from '@/lib/validation/schemas';

import { normalizeActionHistory, type ActionHistoryEntry } from './diffUtils';

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
