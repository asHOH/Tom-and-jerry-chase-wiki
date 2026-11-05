import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { getEditModeActionsStorageKey } from '@/lib/localStorage';
import { actionHistorySchema } from '@/lib/validation/schemas';

import { normalizeActionHistory, type ActionHistoryEntry } from './diffUtils';

export class EditDraftPersistenceError extends Error {
  constructor(readonly kind: 'unavailable' | 'invalid' | 'conflict') {
    super(
      kind === 'conflict'
        ? '其他页面已修改本地草稿，请保留当前内容后重新进入编辑模式。'
        : kind === 'invalid'
          ? '本地草稿格式异常，已保留原始记录，请先恢复草稿。'
          : '本地草稿保存失败，刷新或离开可能丢失修改，请重试保存。'
    );
    this.name = 'EditDraftPersistenceError';
  }
}

export type EditHistoryStore = Readonly<{
  read: (entityType: PublishableEntityType) => ActionHistoryEntry[];
  append: (entityType: PublishableEntityType, entry: ActionHistoryEntry) => void;
  replace: (entityType: PublishableEntityType, history: ActionHistoryEntry[]) => boolean;
}>;

export function createBrowserEditHistoryStore(): EditHistoryStore {
  const durable = new Map<PublishableEntityType, string | null>();
  const store: EditHistoryStore = {
    read: (entityType) => {
      let raw: string | null;
      try {
        raw = window.localStorage.getItem(getEditModeActionsStorageKey(entityType));
      } catch {
        throw new EditDraftPersistenceError('unavailable');
      }
      let history: ActionHistoryEntry[];
      try {
        history = actionHistorySchema.parse(
          raw === null ? [] : JSON.parse(raw)
        ) as ActionHistoryEntry[];
      } catch {
        throw new EditDraftPersistenceError('invalid');
      }
      durable.set(entityType, raw);
      return normalizeActionHistory(history);
    },
    append: (entityType, entry) => {
      store.replace(entityType, [...store.read(entityType), entry]);
    },
    replace: (entityType, history) => {
      const key = getEditModeActionsStorageKey(entityType);
      try {
        const storage = window.localStorage;
        if (storage.getItem(key) !== durable.get(entityType)) {
          throw new EditDraftPersistenceError('conflict');
        }
        const raw = history.length > 0 ? JSON.stringify(history) : null;
        if (raw === null) storage.removeItem(key);
        else storage.setItem(key, raw);
        if (storage.getItem(key) !== raw) throw new EditDraftPersistenceError('unavailable');
        durable.set(entityType, raw);
        return true;
      } catch (error) {
        if (error instanceof EditDraftPersistenceError) throw error;
        throw new EditDraftPersistenceError('unavailable');
      }
    },
  };
  return store;
}
