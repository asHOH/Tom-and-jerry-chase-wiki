'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { subscribe } from 'valtio';

import { usePermissions } from '@/lib/auth/PermissionProvider';
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
import { getEntityRegistry as getEntityRegistrySnapshot } from '@/lib/edit/editModeRegistry';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import { getPublishErrorMessage } from '@/lib/gameData/publishErrorMessage';
import {
  getGameDataSubmitOutcomeFromResults,
  getGameDataSubmitSuccessMessage,
  resolveGameDataAdvancedSubmit,
  type GameDataAdvancedSubmit,
  type GameDataSubmitMode,
} from '@/lib/gameData/submitMode';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useEditMode } from '@/context/EditModeContext';
import type { Json } from '@/data/database.types';

const entityRegistry = getEntityRegistrySnapshot();

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
  advancedSubmit: GameDataAdvancedSubmit;
  discardChanges: (options?: { showToast?: boolean; suppressSync?: boolean }) => void;
  publishChanges: (
    message?: string,
    options?: {
      submitMode?: GameDataSubmitMode;
    }
  ) => Promise<boolean>;
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
  const permissions = usePermissions();
  const entityKey = entityId.trim();
  const { isEditMode: originalIsEditMode, isPreviewMode } = useEditMode();
  const [isPublishing, setIsPublishing] = useState(false);
  const [_actionCountTrigger, setActionCountTrigger] = useState(0);
  const draftLoadedRef = useRef(false);
  const [draftInfo, setDraftInfo] = useState<PageEditModeResult['draftInfo']>(null);
  const [draftsSummary, setDraftsSummary] = useState<PageEditModeResult['draftsSummary']>([]);
  const isEditMode = originalIsEditMode && !isPreviewMode;
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
    const { matching } = splitActionHistoryByEntity(history, entityKey);
    const currentRoot = entityRegistry.get(entityType);
    return squashActions(matching, currentRoot ? { currentRoot } : undefined).length;
  }, [entityType, entityKey]);

  const getPublishDraft = useCallback(() => {
    const storageKey = getActionsStorageKey(entityType);
    const history = readActionHistory(storageKey);
    const { matching, remaining } = splitActionHistoryByEntity(history, entityKey);
    const currentRoot = entityRegistry.get(entityType);
    const squashed = squashActions(matching, currentRoot ? { currentRoot } : undefined);
    return { storageKey, remaining, squashed };
  }, [entityType, entityKey]);

  const squashedDraft = useMemo(() => {
    void _actionCountTrigger;
    return getPublishDraft().squashed;
  }, [_actionCountTrigger, getPublishDraft]);

  const isDirty = useMemo(() => {
    // Trigger re-evaluation when _actionCountTrigger changes
    void _actionCountTrigger;
    return getActionCount() > 0;
  }, [_actionCountTrigger, getActionCount]);

  const debouncedActionCount = useDebouncedValue(_actionCountTrigger, 800);

  const advancedSubmit = useMemo(
    () =>
      resolveGameDataAdvancedSubmit({
        entityType,
        entries: squashedDraft as unknown as Json[],
        canAll: permissions.canAll,
      }),
    [entityType, permissions, squashedDraft]
  );

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
        const currentRoot = entityRegistry.get(type);
        const squashed = squashActions(history, currentRoot ? { currentRoot } : undefined);
        return buildDraftSummaryItemsForType(type, squashed, ({ entityId, factionId }) =>
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

  // Reset draft loaded flag when exiting edit mode (not on preview toggle)
  useEffect(() => {
    const wasEditMode = prevEditModeRef.current;
    prevEditModeRef.current = originalIsEditMode;

    if (!originalIsEditMode) {
      draftLoadedRef.current = false;
      setDraftInfo(null);
      setDraftsSummary([]);

      if (wasEditMode) {
        discardChanges({ showToast: false, suppressSync: true });
      }
    }
  }, [originalIsEditMode, discardChanges]);

  const publishChanges = useCallback(
    async (
      message?: string,
      options?: {
        submitMode?: GameDataSubmitMode;
      }
    ): Promise<boolean> => {
      const { storageKey, remaining, squashed } = getPublishDraft();

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
            submitMode: options?.submitMode,
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
            message?: string;
            requestId?: string;
          } | null;
          throw new Error(getPublishErrorMessage(body, '发布失败'));
        }
        const body = (await res.json().catch(() => null)) as {
          result?: Array<{
            is_public: boolean;
            status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';
          }>;
        } | null;

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

        if (showToast) {
          showToast(
            getGameDataSubmitSuccessMessage(
              '改动',
              getGameDataSubmitOutcomeFromResults(body?.result ?? [])
            )
          );
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
    [entityType, getPublishDraft, showToast]
  );

  return {
    isEditMode,
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    advancedSubmit,
    discardChanges,
    publishChanges,
    getActionCount,
  };
}
