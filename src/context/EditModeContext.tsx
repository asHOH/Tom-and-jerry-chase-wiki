'use client';

import {
  createContext,
  ReactNode,
  Suspense,
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
  squashActions,
  subscribers,
  withRecordingSuppressed,
  writeActionHistory,
  type Action,
  type ActionHistoryEntry,
} from '@/lib/edit/diffUtils';
import { getPathSegmentFromEnd } from '@/lib/edit/editModeRouteUtils';
import { isPushSubscribedLocally, subscribeToPushNotifications } from '@/lib/pushClient';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { isEditModeSearchParamEnabled } from '@/hooks/useSearchParamEditMode';
import { useToast } from '@/context/ToastContext';
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

export type PublishableEntityType = (typeof PUBLISHABLE_ENTITY_TYPES)[number];

const ENTITY_LABELS: Record<PublishableEntityType, string> = {
  characters: '角色',
  factions: '阵营',
  cards: '知识卡',
  entities: '衍生物',
  buffs: '状态',
  items: '道具',
  fixtures: '地图组件',
  maps: '地图',
  modes: '模式',
  specialSkills: '特技',
  achievements: '成就',
};

function formatEntityLabel(entityType: PublishableEntityType): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

unstable_enableOp(true);

interface EditModeContextType {
  /** Whether edit mode is active for the current page (from URL ?edit=1) */
  isEditMode: boolean;
  /** Loading state during initialization */
  isLoading: boolean;
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

function setupEntitySubscribers(): void {
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

function teardownSubscribers(): void {
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

export const EditModeProviderInner = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const previousEditModeRef = useRef<boolean>(false);

  // Edit mode is now determined by URL param
  const isEditMode = useMemo(() => {
    return isEditModeSearchParamEnabled(searchParams);
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
      } catch (error) {
        console.error('Failed to persist edit mode state:', error);
      }

      window.dispatchEvent(new CustomEvent('editmode:changed', { detail: { isEditMode } }));
    }

    if (isEditMode && !wasEditMode) {
      // Entering edit mode - load from storage
      loadEntitiesFromStorage();
      setIsLoading(false);

      // Subscribe to all registered entities
      setupEntitySubscribers();

      return () => {
        teardownSubscribers();
      };
    } else if (!isEditMode && wasEditMode) {
      // Exiting edit mode - handled by page-level controls
      // Don't automatically clear here - let the page decide
      setIsLoading(false);
    } else if (isEditMode) {
      // Already in edit mode, just set up subscriptions
      setIsLoading(false);
      setupEntitySubscribers();

      return () => {
        teardownSubscribers();
      };
    }

    setIsLoading(false);
    return undefined;
  }, [isEditMode, hasInitialized]);

  const contextValue = useMemo(
    () => ({
      isEditMode,
      isLoading,
    }),
    [isEditMode, isLoading]
  );

  return <EditModeContext.Provider value={contextValue}>{children}</EditModeContext.Provider>;
};

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense
      fallback={
        <EditModeContext.Provider value={{ isEditMode: false, isLoading: true }}>
          {children}
        </EditModeContext.Provider>
      }
    >
      <EditModeProviderInner>{children}</EditModeProviderInner>
    </Suspense>
  );
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
  draftsSummary: DraftSummaryItem[];
  discardChanges: (options?: { showToast?: boolean; suppressSync?: boolean }) => void;
  publishChanges: (message?: string) => Promise<boolean>;
  getActionCount: () => number;
}

type DraftSummaryItem = {
  entityType: PublishableEntityType;
  entityLabel: string;
  entityId: string;
  itemLabel: string;
  count: number;
  factionId?: 'cat' | 'mouse';
};

type DraftPathParts = {
  entityId: string;
  factionId?: 'cat' | 'mouse';
};

function normalizeActionEntryToList(entry: ActionHistoryEntry): Action[] {
  return Array.isArray(entry) ? entry : [entry];
}

function parseDraftPath(entityType: PublishableEntityType, path: string): DraftPathParts | null {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) return null;

  if (entityType === 'specialSkills') {
    const factionPart = parts[0];
    const skillId = parts[1];
    if (!skillId) return null;

    if (factionPart === 'cat' || factionPart === 'mouse') {
      return { entityId: skillId, factionId: factionPart };
    }

    return { entityId: skillId };
  }

  return { entityId: parts[0]! };
}

function resolveDraftItemLabel(
  entityType: PublishableEntityType,
  entityId: string,
  factionId?: 'cat' | 'mouse'
): string {
  if (entityType === 'specialSkills') {
    const specialSkillRoot = entityRegistry.get(entityType) as
      | {
          cat?: Record<string, unknown>;
          mouse?: Record<string, unknown>;
        }
      | undefined;

    const fromFaction = factionId ? specialSkillRoot?.[factionId]?.[entityId] : undefined;
    const fallback =
      fromFaction ?? specialSkillRoot?.cat?.[entityId] ?? specialSkillRoot?.mouse?.[entityId];
    const skill = fallback as { name?: string; id?: string } | undefined;
    return skill?.name ?? skill?.id ?? entityId;
  }

  const store = entityRegistry.get(entityType) as Record<string, unknown> | undefined;
  const item = store?.[entityId] as { name?: string; id?: string } | undefined;
  return item?.name ?? item?.id ?? entityId;
}

function buildDraftSummaryItemsForType(
  entityType: PublishableEntityType,
  history: ActionHistoryEntry[]
): DraftSummaryItem[] {
  const counters = new Map<
    string,
    {
      entityId: string;
      count: number;
      factionId?: 'cat' | 'mouse';
    }
  >();

  history.forEach((entry) => {
    normalizeActionEntryToList(entry).forEach((action) => {
      const pathParts = parseDraftPath(entityType, action.path);
      if (!pathParts) return;

      const itemKey = `${pathParts.factionId ?? ''}:${pathParts.entityId}`;
      const current = counters.get(itemKey);
      if (current) {
        current.count += 1;
        return;
      }

      const nextCounter: {
        entityId: string;
        count: number;
        factionId?: 'cat' | 'mouse';
      } = {
        entityId: pathParts.entityId,
        count: 1,
      };

      if (pathParts.factionId) {
        nextCounter.factionId = pathParts.factionId;
      }

      counters.set(itemKey, nextCounter);
    });
  });

  return Array.from(counters.values()).map((counter) => {
    const summary: DraftSummaryItem = {
      entityType,
      entityLabel: formatEntityLabel(entityType),
      entityId: counter.entityId,
      itemLabel: resolveDraftItemLabel(entityType, counter.entityId, counter.factionId),
      count: counter.count,
    };

    if (counter.factionId) {
      summary.factionId = counter.factionId;
    }

    return summary;
  });
}

function sortDraftSummaryItems(items: DraftSummaryItem[]): DraftSummaryItem[] {
  return items.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    const typeCompare = a.entityLabel.localeCompare(b.entityLabel, 'zh-CN');
    if (typeCompare !== 0) {
      return typeCompare;
    }

    return a.itemLabel.localeCompare(b.itemLabel, 'zh-CN');
  });
}

/**
 * Hook for page-level edit mode management.
 * Provides draft saving, publishing, and dirty state tracking for a specific entity.
 */
export function usePageEditMode(options: PageEditModeOptions): PageEditModeResult {
  const { entityType, entityId, showToast } = options;
  const { successWithAction, success, error: showError } = useToast();
  const entityKey = entityId.trim();
  const { isEditMode } = useEditMode();
  const [isPublishing, setIsPublishing] = useState(false);
  const [_actionCountTrigger, setActionCountTrigger] = useState(0);
  const draftLoadedRef = useRef(false);
  const [draftInfo, setDraftInfo] = useState<PageEditModeResult['draftInfo']>(null);
  const [draftsSummary, setDraftsSummary] = useState<PageEditModeResult['draftsSummary']>([]);
  const prevEditModeRef = useRef(isEditMode);

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

  useEffect(() => {
    if (!isEditMode) return;
    if (typeof window === 'undefined') return;

    const summary = sortDraftSummaryItems(
      PUBLISHABLE_ENTITY_TYPES.flatMap((type) => {
        const storageKey = getActionsStorageKey(type);
        const history = readActionHistory(storageKey);
        return buildDraftSummaryItemsForType(type, history);
      })
    );

    setDraftsSummary(summary);
  }, [debouncedActionCount, isEditMode]);

  const discardChanges = useCallback(
    (options?: { showToast?: boolean; suppressSync?: boolean }) => {
      const { showToast: shouldShowToast = true, suppressSync = false } = options ?? {};
      const storageKey = getActionsStorageKey(entityType);
      const entity = entityRegistry.get(entityType);

      if (entity) {
        const history = readActionHistory(storageKey);
        const { matching, remaining } = splitActionHistoryByEntity(history, entityKey);
        const applyInversions = () => {
          for (let i = matching.length - 1; i >= 0; i -= 1) {
            applyActionEntry(entity, invertActionEntry(matching[i]!));
          }
        };

        if (matching.length > 0) {
          if (suppressSync) {
            const storedSubscribers = subscribers[storageKey];
            if (storedSubscribers) {
              storedSubscribers[1]();
              try {
                applyInversions();
              } finally {
                if (isEditMode) storedSubscribers[0]();
              }
            } else {
              applyInversions();
            }
          } else {
            withRecordingSuppressed(storageKey, applyInversions);
          }
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

      if (shouldShowToast && showToast) showToast('已放弃所有修改');
    },
    [entityType, entityKey, isEditMode, showToast]
  );

  // Reset draft loaded flag when exiting edit mode
  useEffect(() => {
    const wasEditMode = prevEditModeRef.current;
    prevEditModeRef.current = isEditMode;

    if (!isEditMode) {
      draftLoadedRef.current = false;
      setDraftInfo(null);
      setDraftsSummary([]);

      if (wasEditMode) {
        discardChanges({ showToast: false, suppressSync: true });
      }
    }
  }, [isEditMode, discardChanges]);

  const publishChanges = useCallback(
    async (message?: string): Promise<boolean> => {
      const storageKey = getActionsStorageKey(entityType);
      const history = readActionHistory(storageKey);
      const { matching, remaining } = splitActionHistoryByEntity(history, entityKey);
      const squashed = squashActions(matching);

      if (squashed.length === 0) {
        if (showToast) showToast('没有需要发布的修改');

        if (typeof window !== 'undefined') {
          if (remaining.length === 0) {
            window.localStorage.removeItem(storageKey);
          } else {
            writeActionHistory(storageKey, remaining);
          }
        }
        setDraftInfo(null);
        setActionCountTrigger((prev) => prev + 1);
        return false;
      }

      setIsPublishing(true);
      try {
        const res = await fetch('/api/game-data-actions/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            entries: squashed,
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

        if (!isPushSubscribedLocally()) {
          successWithAction('改动已提交，等待审核。是否需要接收审核结果通知？', '订阅通知', () => {
            subscribeToPushNotifications().then((isSuccess) => {
              if (isSuccess) {
                success('通知订阅成功！');
              } else {
                showError('通知订阅失败或被拒绝。');
              }
            });
          });
        } else if (showToast) {
          showToast('改动已提交，等待审核');
        }

        return true;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : '发布失败';
        if (showToast) showToast(errorMsg);
        return false;
      } finally {
        setIsPublishing(false);
      }
    },
    [entityType, entityKey, showToast, successWithAction, success, showError]
  );

  return {
    isEditMode,
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
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

function useRouteParamFromEnd(indexFromEnd: number): string {
  const pathname = usePathname();
  return useMemo(() => getPathSegmentFromEnd(pathname, indexFromEnd), [pathname, indexFromEnd]);
}

export const useLocalCharacter = () => {
  const characterId = useRouteParamFromEnd(0);
  return { characterId };
};

export const useLocalCard = () => {
  const cardId = useRouteParamFromEnd(0);
  return { cardId };
};

export const useLocalEntity = () => {
  const entityName = useRouteParamFromEnd(0);
  return { entityName };
};

export const useLocalBuff = () => {
  const buffName = useRouteParamFromEnd(0);
  return { buffName };
};

export const useLocalItem = () => {
  const itemName = useRouteParamFromEnd(0);
  return { itemName };
};

export const useLocalFixture = () => {
  const fixtureName = useRouteParamFromEnd(0);
  return { fixtureName };
};

export const useLocalMap = () => {
  const mapName = useRouteParamFromEnd(0);
  return { mapName };
};

export const useLocalMode = () => {
  const modeName = useRouteParamFromEnd(0);
  return { modeName };
};

export const useLocalSpecialSkill = () => {
  const skillId = useRouteParamFromEnd(0);
  const factionId = useRouteParamFromEnd(1);
  return { factionId, skillId };
};

export const useLocalAchievement = () => {
  const achievementName = useRouteParamFromEnd(0);
  return { achievementName };
};
