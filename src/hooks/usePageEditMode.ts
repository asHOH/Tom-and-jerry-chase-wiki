'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { subscribe } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import {
  applyActionEntry,
  getActionsStorageKey,
  invertActionEntry,
  readActionHistory,
  squashActions,
  subscribers,
  withRecordingSuppressed,
  writeActionHistory,
} from '@/lib/edit/diffUtils';
import {
  buildDraftSummaryItemsForType,
  sortDraftSummaryItems,
  splitActionHistoryByEntity,
  type DraftSummaryItem,
} from '@/lib/edit/editModeDrafts';
import {
  entityRegistry,
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/edit/editModeRegistry';
import { isPushSubscribedLocally, subscribeToPushNotifications } from '@/lib/pushClient';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useEditMode } from '@/context/EditModeStateContext';
import { useToast } from '@/context/ToastContext';

export type PageEditModeOptions = {
  entityType: PublishableEntityType;
  entityId: string;
  /** Toast function to show notifications */
  showToast?: (message: string, duration?: number) => void;
};

export type PageEditModeResult = {
  isEditMode: boolean;
  isDirty: boolean;
  isPublishing: boolean;
  draftInfo: { actionCount: number } | null;
  draftsSummary: DraftSummaryItem[];
  discardChanges: (options?: { showToast?: boolean; suppressSync?: boolean }) => void;
  publishChanges: (message?: string) => Promise<boolean>;
  getActionCount: () => number;
};

function resolveDraftItemLabel(
  entityType: PublishableEntityType,
  entityId: string,
  factionId?: 'cat' | 'mouse'
): string | undefined {
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
    return skill?.name ?? skill?.id;
  }

  const store = entityRegistry.get(entityType) as Record<string, unknown> | undefined;
  const item = store?.[entityId] as { name?: string; id?: string } | undefined;
  return item?.name ?? item?.id;
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
        return buildDraftSummaryItemsForType(type, history, ({ entityId, factionId }) =>
          resolveDraftItemLabel(type, entityId, factionId)
        );
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
