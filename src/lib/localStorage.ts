type JsonValue = unknown;

export const enum StorageKey {
  ArticleAutoNumbering = 'wiki_auto_numbering_enabled',
  DetailedView = 'isDetailedView',
  EditMode = 'isEditMode',
  EditModeActionsPrefix = 'editmode:actions:',
  EditModeEnabledAt = 'editmode:enabledAt',
  ErrorBoundaryErrors = 'errorBoundaryErrors',
  FeatureDiscoveryPrefix = 'feature_discovered_',
  GuessCharacterDaily = 'guess-character-daily',
  GuessCharacterStreak = 'guess-character-streak',
  HomepageDismissedNotices = 'homepage-dismissed-notices',
  InteractiveMapVisibleCategories = 'interactive-map:visible-categories:v3',
  KnowledgeCardViewMode = 'view-mode',
  LatestSeenVersion = 'tjcw.latestSeenVersion',
  PositioningTagView = 'tjwiki:character-positioning-view',
  StatShowdownScores = 'stat-showdown-scores',
  SwrCache = 'swr-cache',
  TooltipMeasurement = 'tjwiki:measureTextWithHoverTooltips',
  TutorialCharacterEditSeen = 'hasUserSeenCharacterEditTutorial',
  TutorialEditModeToolbarSeen = 'hasUserSeenEditModeToolbarTutorial',
}

export const getEditModeActionsStorageKey = (entityType: string): string =>
  `${StorageKey.EditModeActionsPrefix}${entityType}`;

export const getFeatureDiscoveryStorageKey = (featureKey: string): string =>
  `${StorageKey.FeatureDiscoveryPrefix}${featureKey}`;

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const parseJson = <T extends JsonValue>(value: string): T | undefined => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

/**
 * Safe access to browser localStorage.
 *
 * All methods are SSR-safe and treat unavailable, quota-limited, or corrupted
 * storage as a best-effort failure.
 */
export const storage = {
  getItem(key: string): string | null {
    const localStorage = getLocalStorage();
    if (!localStorage) return null;

    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    const localStorage = getLocalStorage();
    if (!localStorage) return false;

    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key: string): boolean {
    const localStorage = getLocalStorage();
    if (!localStorage) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  getJson<T>(key: string): T | undefined {
    const value = storage.getItem(key);
    return value === null ? undefined : parseJson<T>(value);
  },

  setJson<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      return serialized === undefined ? false : storage.setItem(key, serialized);
    } catch {
      return false;
    }
  },

  parseJson,
} as const;
