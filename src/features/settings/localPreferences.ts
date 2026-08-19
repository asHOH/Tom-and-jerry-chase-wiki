'use client';

import { useCallback, useEffect, useState } from 'react';

import { storage, StorageKey } from '@/lib/localStorage';
import type { MapPointCategory } from '@/data/types';
import {
  DEFAULT_VISIBLE_CATEGORIES,
  MAP_CATEGORY_LABELS,
} from '@/features/maps/interactive-map/mapUtils';

export type ThemeMode = 'system' | 'light' | 'dark';
export type KnowledgeCardViewMode = 'tree' | 'hybrid' | 'compact';
export type PositioningTagViewMode = 'text' | 'bar' | 'radar';

export type LocalPreferences = {
  articleAutoNumbering: boolean;
  detailedView: boolean;
  interactiveMapVisibleCategories: MapPointCategory[];
  knowledgeCardViewMode: KnowledgeCardViewMode;
  positioningTagViewMode: PositioningTagViewMode;
};

export const LOCAL_PREFERENCE_DEFAULTS: LocalPreferences = {
  articleAutoNumbering: false,
  detailedView: false,
  interactiveMapVisibleCategories: [...DEFAULT_VISIBLE_CATEGORIES],
  knowledgeCardViewMode: 'tree',
  positioningTagViewMode: 'text',
};

const STORAGE_KEYS = {
  articleAutoNumbering: StorageKey.ArticleAutoNumbering,
  detailedView: StorageKey.DetailedView,
  interactiveMapVisibleCategories: StorageKey.InteractiveMapVisibleCategories,
  knowledgeCardViewMode: StorageKey.KnowledgeCardViewMode,
  positioningTagViewMode: StorageKey.PositioningTagView,
} as const satisfies Record<keyof LocalPreferences, StorageKey>;

const LOCAL_PREFERENCE_EVENT = 'tjwiki:local-preference-change';
const KNOWLEDGE_CARD_VIEW_MODES = new Set<KnowledgeCardViewMode>(['tree', 'hybrid', 'compact']);
const POSITIONING_TAG_VIEW_MODES = new Set<PositioningTagViewMode>(['text', 'bar', 'radar']);
const MAP_POINT_CATEGORIES = new Set<MapPointCategory>(
  Object.keys(MAP_CATEGORY_LABELS) as MapPointCategory[]
);

const parseStoredValue = (value: string | null): unknown => {
  if (value === null) return undefined;
  return storage.parseJson<unknown>(value) ?? value;
};

const normalizePreference = <K extends keyof LocalPreferences>(
  key: K,
  value: unknown
): LocalPreferences[K] => {
  switch (key) {
    case 'articleAutoNumbering':
    case 'detailedView':
      return (value === true || value === 'true') as LocalPreferences[K];
    case 'knowledgeCardViewMode':
      return (
        typeof value === 'string' && KNOWLEDGE_CARD_VIEW_MODES.has(value as KnowledgeCardViewMode)
          ? value
          : LOCAL_PREFERENCE_DEFAULTS.knowledgeCardViewMode
      ) as LocalPreferences[K];
    case 'positioningTagViewMode':
      return (
        typeof value === 'string' && POSITIONING_TAG_VIEW_MODES.has(value as PositioningTagViewMode)
          ? value
          : LOCAL_PREFERENCE_DEFAULTS.positioningTagViewMode
      ) as LocalPreferences[K];
    case 'interactiveMapVisibleCategories': {
      if (!Array.isArray(value)) {
        return [
          ...LOCAL_PREFERENCE_DEFAULTS.interactiveMapVisibleCategories,
        ] as LocalPreferences[K];
      }
      return [
        ...new Set(
          value.filter(
            (category): category is MapPointCategory =>
              typeof category === 'string' && MAP_POINT_CATEGORIES.has(category as MapPointCategory)
          )
        ),
      ] as LocalPreferences[K];
    }
  }
};

export const readLocalPreference = <K extends keyof LocalPreferences>(
  key: K
): LocalPreferences[K] =>
  normalizePreference(key, parseStoredValue(storage.getItem(STORAGE_KEYS[key])));

const dispatchPreferenceChange = (key: keyof LocalPreferences | null) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LOCAL_PREFERENCE_EVENT, { detail: { key } }));
};

export const writeLocalPreference = <K extends keyof LocalPreferences>(
  key: K,
  value: LocalPreferences[K]
): boolean => {
  const normalized = normalizePreference(key, value);
  const saved = storage.setJson(STORAGE_KEYS[key], normalized);
  if (saved) dispatchPreferenceChange(key);
  return saved;
};

export const resetLocalPreferences = (): boolean => {
  const results = Object.values(STORAGE_KEYS).map((key) => storage.removeItem(key));
  dispatchPreferenceChange(null);
  return results.every(Boolean);
};

export const subscribeToLocalPreference = (
  key: keyof LocalPreferences,
  listener: () => void
): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const storageKey = STORAGE_KEYS[key];
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) listener();
  };
  const handleLocalChange = (event: Event) => {
    const changedKey = (event as CustomEvent<{ key: keyof LocalPreferences | null }>).detail?.key;
    if (changedKey === key || changedKey === null) listener();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(LOCAL_PREFERENCE_EVENT, handleLocalChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(LOCAL_PREFERENCE_EVENT, handleLocalChange);
  };
};

export function useLocalPreference<K extends keyof LocalPreferences>(
  key: K
): readonly [LocalPreferences[K], (value: LocalPreferences[K]) => boolean] {
  const [value, setValue] = useState<LocalPreferences[K]>(() => LOCAL_PREFERENCE_DEFAULTS[key]);

  useEffect(() => {
    const update = () => setValue(readLocalPreference(key));
    update();
    return subscribeToLocalPreference(key, update);
  }, [key]);

  const setPreference = useCallback(
    (nextValue: LocalPreferences[K]) => {
      const saved = writeLocalPreference(key, nextValue);
      if (saved) setValue(readLocalPreference(key));
      return saved;
    },
    [key]
  );

  return [value, setPreference] as const;
}
