'use client';

import { PUBLISHABLE_ENTITY_TYPES } from '@/lib/gameData/publishableEntityTypes';
import {
  getEditModeActionsStorageKey,
  getFeatureDiscoveryStorageKey,
  storage,
  StorageKey,
} from '@/lib/localStorage';

const removeKeys = (keys: readonly string[]): boolean =>
  keys.map((key) => storage.removeItem(key)).every(Boolean);

export const resetGuidanceAndAnnouncements = (): boolean =>
  removeKeys([
    StorageKey.HomepageDismissedNotices,
    StorageKey.TutorialCharacterEditSeen,
    StorageKey.TutorialEditModeToolbarSeen,
    getFeatureDiscoveryStorageKey('detail_toggle'),
    getFeatureDiscoveryStorageKey('edit_button'),
  ]);

export const resetMiniGameProgress = (): boolean =>
  removeKeys([
    StorageKey.GuessCharacterDaily,
    StorageKey.GuessCharacterStreak,
    StorageKey.StatShowdownScores,
  ]);

export const clearAllLocalEditDrafts = (): boolean =>
  removeKeys(
    PUBLISHABLE_ENTITY_TYPES.flatMap((entityType) => [
      entityType,
      getEditModeActionsStorageKey(entityType),
    ])
  );
