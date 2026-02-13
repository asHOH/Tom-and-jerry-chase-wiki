'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { proxy, subscribe, unstable_enableOp } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import {
  actionsFromValtioOps,
  appendActionHistoryEntry,
  applyActionEntry,
  getActionsStorageKey,
  invertActionEntry,
  readActionHistory,
  subscribers,
  withRecordingSuppressed,
  writeActionHistory,
  type Action,
  type ActionHistoryEntry,
} from '@/lib/edit/diffUtils';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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

// Publishable entity types
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

unstable_enableOp(true);

export type PublishableEntityType = (typeof PUBLISHABLE_ENTITY_TYPES)[number];

interface EditModeContextType {
  /** Whether edit mode is active for the current page (from URL ?edit=1) */
  isEditMode: boolean;
  /** Loading state during initialization */
  isLoading: boolean;
  /** Revoke local actions for a specific entity type */
  revokeLocalActions: (entityType: string) => void;
}

export const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

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

/**
 * Loads all registered entities from localStorage action history.
 * Called when entering edit mode to restore previous session.
 */
function loadEntitiesFromStorage(): void {
  if (typeof localStorage === 'undefined') return;

  Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
    try {
      const actionsStorageKey = getActionsStorageKey(entityType);
      const history = readActionHistory(actionsStorageKey);
      if (history.length > 0) {
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

/**
 * Restores all registered entities to their original canonical state.
 */
function restoreEntitiesToCanonical(): void {
  const original = {
    characters: GameDataManager.getCharacters(),
    cards: GameDataManager.getCards(),
  };

  Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
    if (entityType === 'characters' && original.characters) {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(original.characters).forEach(([key, value]) => {
        entity[key] = proxy(value);
      });
    } else if (entityType === 'cards' && original.cards) {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(original.cards).forEach(([key, value]) => {
        entity[key] = proxy(value);
      });
    } else if (entityType === 'entities') {
      const canonical = { ...entities.cat, ...entities.mouse } as Record<string, unknown>;
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(canonical).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'buffs') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(buffs as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'items') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(items as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'fixtures') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(fixtures as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'maps') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(maps as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'modes') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(modes as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'specialSkills') {
      const root = entity as unknown as {
        cat?: Record<string, unknown>;
        mouse?: Record<string, unknown>;
      };

      if (!root.cat) root.cat = {};
      if (!root.mouse) root.mouse = {};

      Object.keys(root.cat).forEach((key) => {
        delete root.cat![key];
      });
      Object.keys(root.mouse).forEach((key) => {
        delete root.mouse![key];
      });

      Object.entries(specialSkills.cat as Record<string, unknown>).forEach(([key, value]) => {
        root.cat![key] = proxy(value as Record<string, unknown>);
      });
      Object.entries(specialSkills.mouse as Record<string, unknown>).forEach(([key, value]) => {
        root.mouse![key] = proxy(value as Record<string, unknown>);
      });
    } else if (entityType === 'achievements') {
      Object.keys(entity).forEach((key) => {
        delete entity[key];
      });
      Object.entries(achievements as Record<string, unknown>).forEach(([key, value]) => {
        entity[key] = proxy(value as Record<string, unknown>);
      });
    }
  });

  GameDataManager.invalidate();
}

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const previousEditModeRef = useRef<boolean>(false);

  // Edit mode is now determined by URL param
  const isEditMode = useMemo(() => {
    return searchParams.get('edit') === '1';
  }, [searchParams]);

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasInitialized(true);
    }
  }, []);

  // Set up entity syncing when edit mode is active
  useEffect(() => {
    if (!hasInitialized) return undefined;

    const wasEditMode = previousEditModeRef.current;
    previousEditModeRef.current = isEditMode;

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('isEditMode', JSON.stringify(isEditMode));
        if (isEditMode && !wasEditMode) {
          window.localStorage.setItem('editmode:enabledAt', String(Date.now()));
        }
      } catch {
        // ignore storage failures
      }

      window.dispatchEvent(new CustomEvent('editmode:changed', { detail: { isEditMode } }));
    }

    if (isEditMode && !wasEditMode) {
      // Entering edit mode - load from storage
      loadEntitiesFromStorage();
      setIsLoading(false);

      // Subscribe to all registered entities
      Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
        const key = getActionsStorageKey(entityType);
        subscribers[key] = [
          () => {
            subscribers[key]![1] = syncEntityToLocalStorage(entityType, entity);
          },
          void 0 as unknown as () => void,
        ];
        subscribers[key][0]();
      });

      return () => {
        Object.values(subscribers).forEach(([, unsub]) => unsub());
      };
    } else if (!isEditMode && wasEditMode) {
      // Exiting edit mode - handled by page-level controls
      // Don't automatically clear here - let the page decide
      setIsLoading(false);
    } else if (isEditMode) {
      // Already in edit mode, just set up subscriptions
      setIsLoading(false);
      Array.from(entityRegistry.entries()).forEach(([entityType, entity]) => {
        const key = getActionsStorageKey(entityType);
        subscribers[key] = [
          () => {
            subscribers[key]![1] = syncEntityToLocalStorage(entityType, entity);
          },
          void 0 as unknown as () => void,
        ];
        subscribers[key][0]();
      });

      return () => {
        Object.values(subscribers).forEach(([, unsub]) => unsub());
      };
    }

    setIsLoading(false);
    return undefined;
  }, [isEditMode, hasInitialized]);

  const revokeLocalActions = useCallback((entityType: string): void => {
    if (typeof window === 'undefined') return;
    const entity = entityRegistry.get(entityType);
    if (!entity) return;

    const actionsStorageKey = getActionsStorageKey(entityType);
    const history = readActionHistory(actionsStorageKey);
    if (history.length === 0) {
      try {
        window.localStorage.removeItem(actionsStorageKey);
      } catch {
        // ignore
      }
      return;
    }

    try {
      withRecordingSuppressed(actionsStorageKey, () => {
        for (let i = history.length - 1; i >= 0; i -= 1) {
          const entry = history[i]!;
          applyActionEntry(entity, invertActionEntry(entry));
        }
      });
      window.localStorage.removeItem(actionsStorageKey);
      GameDataManager.invalidate();
    } catch (error) {
      console.error(`Failed to revoke ${entityType} local actions:`, error);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      isEditMode,
      isLoading,
      revokeLocalActions,
    }),
    [isEditMode, isLoading, revokeLocalActions]
  );

  return <EditModeContext.Provider value={contextValue}>{children}</EditModeContext.Provider>;
};

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};

function normalizeActionEntry(actions: Action[]): ActionHistoryEntry {
  return actions.length === 1 ? actions[0]! : actions;
}

function matchesEntityAction(action: Action, entityId: string): boolean {
  if (!entityId) return true;
  return action.path === entityId || action.path.startsWith(`${entityId}.`);
}

function splitActionEntryByEntity(
  entry: ActionHistoryEntry,
  entityId: string
): { matching: ActionHistoryEntry | null; remaining: ActionHistoryEntry | null } {
  if (Array.isArray(entry)) {
    const matching: Action[] = [];
    const remaining: Action[] = [];

    entry.forEach((action) => {
      if (matchesEntityAction(action, entityId)) {
        matching.push(action);
      } else {
        remaining.push(action);
      }
    });

    return {
      matching: matching.length > 0 ? normalizeActionEntry(matching) : null,
      remaining: remaining.length > 0 ? normalizeActionEntry(remaining) : null,
    };
  }

  if (matchesEntityAction(entry, entityId)) {
    return { matching: entry, remaining: null };
  }

  return { matching: null, remaining: entry };
}

function splitActionHistoryByEntity(history: ActionHistoryEntry[], entityId: string) {
  const matching: ActionHistoryEntry[] = [];
  const remaining: ActionHistoryEntry[] = [];

  history.forEach((entry) => {
    const { matching: matchingEntry, remaining: remainingEntry } = splitActionEntryByEntity(
      entry,
      entityId
    );

    if (matchingEntry) matching.push(matchingEntry);
    if (remainingEntry) remaining.push(remainingEntry);
  });

  return { matching, remaining };
}

// ============================================================================
// Page-level edit mode hook for pages that support editing
// ============================================================================

interface PageEditModeOptions {
  entityType: PublishableEntityType;
  entityId: string;
  /** Toast function to show notifications */
  showToast?: (message: string, duration?: number) => void;
}

interface PageEditModeResult {
  isEditMode: boolean;
  isDirty: boolean;
  isPublishing: boolean;
  draftInfo: { actionCount: number } | null;
  discardChanges: () => void;
  publishChanges: (message?: string) => Promise<boolean>;
  getActionCount: () => number;
}

/**
 * Hook for page-level edit mode management.
 * Provides draft saving, publishing, and dirty state tracking for a specific entity.
 */
export function usePageEditMode(options: PageEditModeOptions): PageEditModeResult {
  const { entityType, entityId, showToast } = options;
  const entityKey = entityId.trim();
  const { isEditMode } = useEditMode();
  const [isPublishing, setIsPublishing] = useState(false);
  const [_actionCountTrigger, setActionCountTrigger] = useState(0);
  const draftLoadedRef = useRef(false);
  const [draftInfo, setDraftInfo] = useState<PageEditModeResult['draftInfo']>(null);

  // Reset draft loaded flag when exiting edit mode
  useEffect(() => {
    if (!isEditMode) {
      draftLoadedRef.current = false;
      setDraftInfo(null);
    }
  }, [isEditMode]);

  // Subscribe to entity changes to track dirty state
  useEffect(() => {
    if (!isEditMode) return undefined;

    const entity = entityRegistry.get(entityType);
    if (!entity) return undefined;

    const unsubscribe = subscribe(entity, () => {
      setActionCountTrigger((prev) => prev + 1);
    });

    return unsubscribe;
  }, [isEditMode, entityType]);

  const getActionCount = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    const storageKey = getActionsStorageKey(entityType);
    const history = readActionHistory(storageKey);
    return splitActionHistoryByEntity(history, entityKey).matching.length;
  }, [entityType, entityKey]);

  const isDirty = useMemo(() => {
    // Trigger re-evaluation when _actionCountTrigger changes
    void _actionCountTrigger;
    return getActionCount() > 0;
  }, [_actionCountTrigger, getActionCount]);

  const debouncedActionCount = useDebouncedValue(_actionCountTrigger, 800);

  useEffect(() => {
    if (!isEditMode) return;

    const count = getActionCount();
    if (!draftLoadedRef.current) {
      if (count > 0 && showToast) {
        showToast(`已恢复草稿 (${count} 条修改)`, 4000);
      }
      draftLoadedRef.current = true;
    }

    setDraftInfo(count > 0 ? { actionCount: count } : null);
  }, [debouncedActionCount, getActionCount, isEditMode, showToast]);

  const discardChanges = useCallback(() => {
    // Clear action history
    const storageKey = getActionsStorageKey(entityType);
    const entity = entityRegistry.get(entityType);

    if (entity) {
      const history = readActionHistory(storageKey);
      const { matching, remaining } = splitActionHistoryByEntity(history, entityKey);
      console.log(matching, remaining);
      if (matching.length > 0) {
        withRecordingSuppressed(storageKey, () => {
          console.log(storageKey);
          for (let i = matching.length - 1; i >= 0; i -= 1) {
            applyActionEntry(entity, invertActionEntry(matching[i]!));
          }
        });
      }

      if (typeof window !== 'undefined') {
        if (remaining.length === 0) {
          window.localStorage.removeItem(storageKey);
        } else {
          writeActionHistory(storageKey, remaining);
        }
      }
    }

    setDraftInfo(null);

    GameDataManager.invalidate();
    setActionCountTrigger((prev) => prev + 1);

    if (showToast) showToast('已放弃所有修改');
  }, [entityType, entityKey, showToast]);

  const publishChanges = useCallback(
    async (message?: string): Promise<boolean> => {
      const storageKey = getActionsStorageKey(entityType);
      const history = readActionHistory(storageKey);
      const { matching, remaining } = splitActionHistoryByEntity(history, entityKey);

      if (matching.length === 0) {
        if (showToast) showToast('没有需要发布的修改');
        return false;
      }

      setIsPublishing(true);
      try {
        const res = await fetch('/api/game-data-actions/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            entries: matching,
            message,
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || '发布失败');
        }

        // Clear storage on success
        if (typeof window !== 'undefined') {
          if (remaining.length === 0) {
            window.localStorage.removeItem(storageKey);
          } else {
            writeActionHistory(storageKey, remaining);
          }
        }
        setDraftInfo(null);
        setActionCountTrigger((prev) => prev + 1);

        if (showToast) showToast('改动已提交，等待审核');
        return true;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : '发布失败';
        if (showToast) showToast(errorMsg);
        return false;
      } finally {
        setIsPublishing(false);
      }
    },
    [entityType, entityKey, showToast]
  );

  return {
    isEditMode,
    isDirty,
    isPublishing,
    draftInfo,
    discardChanges,
    publishChanges,
    getActionCount,
  };
}

// ============================================================================
// Helper functions for clearing all edit mode data
// ============================================================================

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

// ============================================================================
// Path-based entity ID extraction hooks
// ============================================================================

export const useLocalCharacter = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const characterId = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { characterId };
};

export const useLocalCard = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const cardId = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { cardId };
};

export const useLocalEntity = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const entityName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { entityName };
};

export const useLocalBuff = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const buffName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { buffName };
};

export const useLocalItem = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const itemName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { itemName };
};

export const useLocalFixture = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const fixtureName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { fixtureName };
};

export const useLocalMap = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const mapName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { mapName };
};

export const useLocalMode = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const modeName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { modeName };
};

export const useLocalSpecialSkill = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const skillId = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  const factionId = decodeURIComponent(pathParts[pathParts.length - 3] || '');
  return { factionId, skillId };
};

export const useLocalAchievement = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const achievementName = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  return { achievementName };
};
