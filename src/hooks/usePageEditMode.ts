'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { subscribe } from 'valtio';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import { GameDataManager } from '@/lib/dataManager';
import { useActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import {
  applyActionEntry,
  getActionsStorageKey,
  invertActionEntry,
  readActionHistory,
  replaceActionHistory,
  squashActions,
  subscribers,
  withRecordingSuppressed,
} from '@/lib/edit/diffUtils';
import {
  buildDraftSummaryItemsForType,
  sortDraftSummaryItems,
  splitActionHistoryByEntity,
  type DraftSummaryItem,
} from '@/lib/edit/editModeDrafts';
import { reconcilePublishHistory } from '@/lib/edit/publishHistory';
import type {
  PendingActionOverlapResponse,
  PendingActionOverlapSummary,
} from '@/lib/gameData/pendingActionAwarenessTypes';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import { getPublishErrorMessage } from '@/lib/gameData/publishErrorMessage';
import {
  clearPublishOperation,
  getOrCreatePublishOperationId,
  getPublishOperationFingerprint,
  PublishOperationConflictError,
} from '@/lib/gameData/publishOperation';
import {
  getGameDataSubmitOutcomeFromResults,
  getGameDataSubmitSuccessMessage,
  resolveGameDataAdvancedSubmit,
  type GameDataAdvancedSubmit,
  type GameDataSubmitMode,
} from '@/lib/gameData/submitMode';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useEditMode } from '@/context/EditModeContext';
import type { PendingActionAwarenessSource } from '@/context/PendingActionAwarenessContext';
import type { Json } from '@/data/database.types';

export type PageEditModeOptions = {
  entityType: PublishableEntityType;
  entityId: string;
  /** Toast function to show notifications */
  showToast?: (message: string, duration?: number) => void;
  /** Called with the user-facing message after a successful submission */
  onPublishSuccess?: (message: string) => void;
  pendingAwareness?: PendingActionAwarenessSource;
};

export type PageEditModeResult = {
  isEditMode: boolean;
  isDirty: boolean;
  isPublishing: boolean;
  draftInfo: { actionCount: number } | null;
  draftsSummary: DraftSummaryItem[];
  advancedSubmit: GameDataAdvancedSubmit;
  pendingAwarenessUnavailable: boolean;
  pendingDraftSummary: PendingActionOverlapSummary | null;
  pendingOverlap: PendingActionOverlapResponse | null;
  discardChanges: (options?: { showToast?: boolean; suppressSync?: boolean }) => void;
  publishChanges: (
    message?: string,
    options?: {
      pendingAcknowledgementToken?: string;
      submitMode?: GameDataSubmitMode;
    }
  ) => Promise<boolean>;
  getActionCount: () => number;
};

function resolveDraftItemLabel(
  entityRegistry: ReadonlyMap<PublishableEntityType, Record<string, unknown>>,
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
  const { entityType, entityId, showToast, onPublishSuccess, pendingAwareness } = options;
  const permissions = usePermissions();
  const entityKey = entityId.trim();
  const { isEditMode: originalIsEditMode, isPreviewMode } = useEditMode();
  const activeRuntime = useActiveEditRuntime();
  const entityRegistry = activeRuntime?.registry.entityRegistry;
  const [isPublishing, setIsPublishing] = useState(false);
  const [_actionCountTrigger, setActionCountTrigger] = useState(0);
  const draftLoadedRef = useRef(false);
  const [draftInfo, setDraftInfo] = useState<PageEditModeResult['draftInfo']>(null);
  const [draftsSummary, setDraftsSummary] = useState<PageEditModeResult['draftsSummary']>([]);
  const [pendingOverlap, setPendingOverlap] = useState<PendingActionOverlapResponse | null>(null);
  const isEditMode = originalIsEditMode && !isPreviewMode;
  const prevEditModeRef = useRef(isEditMode);

  // Subscribe to entity changes to track dirty state
  useEffect(() => {
    if (!isEditMode) return undefined;

    const entity = entityRegistry?.get(entityType);
    if (!entity) return undefined;

    const unsubscribe = subscribe(entity, () => {
      setActionCountTrigger((prev) => prev + 1);
    });

    return unsubscribe;
  }, [entityRegistry, isEditMode, entityType]);

  const getActionCount = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    const storageKey = getActionsStorageKey(entityType);
    const history = readActionHistory(storageKey);
    const { matching } = splitActionHistoryByEntity(history, entityKey);
    const currentRoot = entityRegistry?.get(entityType);
    return squashActions(matching, currentRoot ? { currentRoot } : undefined).length;
  }, [entityRegistry, entityType, entityKey]);

  const getPublishDraft = useCallback(() => {
    const storageKey = getActionsStorageKey(entityType);
    const source = readActionHistory(storageKey);
    const { matching, remaining } = splitActionHistoryByEntity(source, entityKey);
    const currentRoot = entityRegistry?.get(entityType);
    const squashed = squashActions(matching, currentRoot ? { currentRoot } : undefined);
    return { storageKey, source, remaining, squashed };
  }, [entityRegistry, entityType, entityKey]);
  const publishOperationScope = `page:${entityType}:${entityKey}`;

  const squashedDraft = useMemo(() => {
    void _actionCountTrigger;
    return getPublishDraft().squashed;
  }, [_actionCountTrigger, getPublishDraft]);
  const flattenedSquashedDraft = useMemo(
    () => squashedDraft.flatMap((entry) => (Array.isArray(entry) ? entry : [entry])),
    [squashedDraft]
  );
  const pendingDraftSummary = useMemo(
    () => pendingAwareness?.summarizeActions(flattenedSquashedDraft) ?? null,
    [flattenedSquashedDraft, pendingAwareness]
  );

  useEffect(() => {
    setPendingOverlap(null);
  }, [squashedDraft]);

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
        const currentRoot = entityRegistry?.get(type);
        const squashed = squashActions(history, currentRoot ? { currentRoot } : undefined);
        return buildDraftSummaryItemsForType(type, squashed, ({ entityId, factionId }) =>
          entityRegistry
            ? resolveDraftItemLabel(entityRegistry, type, entityId, factionId)
            : undefined
        );
      })
    );

    setDraftsSummary(summary);
  }, [debouncedActionCount, entityRegistry, isEditMode]);

  const discardChanges = useCallback(
    (options?: { showToast?: boolean; suppressSync?: boolean }) => {
      const { showToast: shouldShowToast = true, suppressSync = false } = options ?? {};
      const storageKey = getActionsStorageKey(entityType);
      const entity = entityRegistry?.get(entityType);
      let cleanupSucceeded = true;

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

        cleanupSucceeded =
          typeof window === 'undefined' || replaceActionHistory(storageKey, remaining);

        if (!cleanupSucceeded) {
          if (shouldShowToast && showToast) showToast('放弃修改后本地草稿清理失败，请重试');
        } else {
          clearPublishOperation(publishOperationScope);
        }
      }

      if (cleanupSucceeded && entityRegistry?.get(entityType)) setDraftInfo(null);

      GameDataManager.invalidate();
      setActionCountTrigger((prev) => prev + 1);

      if (cleanupSucceeded && shouldShowToast && showToast) showToast('已放弃所有修改');
    },
    [entityRegistry, entityType, entityKey, isEditMode, publishOperationScope, showToast]
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
        pendingAcknowledgementToken?: string;
        submitMode?: GameDataSubmitMode;
      }
    ): Promise<boolean> => {
      const { storageKey, source, remaining, squashed } = getPublishDraft();

      if (squashed.length === 0) {
        const cleanupSucceeded =
          typeof window === 'undefined' || replaceActionHistory(storageKey, remaining);
        if (cleanupSucceeded) {
          setDraftInfo(null);
          clearPublishOperation(publishOperationScope);
          if (showToast) showToast('没有需要发布的修改');
        } else if (showToast) {
          showToast('本地草稿清理失败，请重试');
        }
        setActionCountTrigger((prev) => prev + 1);
        return false;
      }

      const fingerprint = getPublishOperationFingerprint({
        endpoint: '/api/game-data-actions/publish',
        entries: squashed,
        message: message?.trim() || null,
        submitMode: options?.submitMode ?? 'default',
      });
      setIsPublishing(true);
      try {
        const operationId = getOrCreatePublishOperationId(publishOperationScope, fingerprint);
        const res = await fetch('/api/game-data-actions/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': operationId },
          body: JSON.stringify({
            entityType,
            entries: squashed,
            message,
            pendingAcknowledgementToken: options?.pendingAcknowledgementToken,
            submitMode: options?.submitMode,
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
            message?: string;
            requestId?: string;
          } | null;
          if (
            res.status === 409 &&
            body?.error === 'pending_action_overlap' &&
            typeof (body as { pendingAcknowledgementToken?: unknown })
              .pendingAcknowledgementToken === 'string'
          ) {
            setPendingOverlap(body as PendingActionOverlapResponse);
            try {
              await pendingAwareness?.refresh();
            } catch (refreshError) {
              console.warn(
                'Failed to refresh pending action awareness after overlap.',
                refreshError
              );
            }
            if (showToast) showToast('检测到与待审核改动重叠的字段，请确认风险后重试');
            return false;
          }
          throw new Error(getPublishErrorMessage(body, '发布失败'));
        }
        const body = (await res.json().catch(() => null)) as {
          result?: Array<{
            is_public: boolean;
            status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';
          }>;
        } | null;

        const latest = readActionHistory(storageKey);
        const reconciled = reconcilePublishHistory(source, remaining, latest);
        const cleanupSucceeded =
          reconciled !== null &&
          (typeof window === 'undefined' || replaceActionHistory(storageKey, reconciled));
        if (cleanupSucceeded) clearPublishOperation(publishOperationScope);
        const cleanupWarning =
          reconciled === null
            ? '发布成功，但本地草稿历史已变化，未清理已发布草稿，请确认后重试。'
            : cleanupSucceeded
              ? null
              : '发布成功，但本地草稿清理失败，请确认后重试。';

        if (reconciled !== null) {
          const { matching } = splitActionHistoryByEntity(reconciled, entityKey);
          const currentRoot = entityRegistry?.get(entityType);
          const remainingCount = squashActions(
            matching,
            currentRoot ? { currentRoot } : undefined
          ).length;
          setDraftInfo(remainingCount > 0 ? { actionCount: remainingCount } : null);
        }
        setPendingOverlap(null);
        setActionCountTrigger((prev) => prev + 1);
        try {
          await pendingAwareness?.refresh();
        } catch (refreshError) {
          console.warn('Failed to refresh pending action awareness after publish.', refreshError);
        }

        const successMessage = getGameDataSubmitSuccessMessage(
          '改动',
          getGameDataSubmitOutcomeFromResults(body?.result ?? [])
        );
        if (onPublishSuccess) {
          onPublishSuccess(successMessage);
        } else if (showToast) {
          showToast(successMessage);
        }

        if (cleanupWarning && showToast) showToast(cleanupWarning);
        if (!cleanupSucceeded) return false;

        const currentHistory = readActionHistory(storageKey);
        const { matching: remainingMatching } = splitActionHistoryByEntity(
          currentHistory,
          entityKey
        );
        const currentRoot = entityRegistry?.get(entityType);
        return (
          squashActions(remainingMatching, currentRoot ? { currentRoot } : undefined).length === 0
        );
      } catch (e) {
        if (e instanceof PublishOperationConflictError) {
          if (showToast) {
            showToast('当前发布操作仍待处理，请先完成清理或放弃草稿后再提交不同修改。');
          }
          return false;
        }
        const errorMsg = e instanceof Error ? e.message : '发布失败';
        if (showToast) showToast(errorMsg);
        return false;
      } finally {
        setIsPublishing(false);
      }
    },
    [
      entityKey,
      entityRegistry,
      entityType,
      getPublishDraft,
      onPublishSuccess,
      pendingAwareness,
      publishOperationScope,
      showToast,
    ]
  );

  return {
    isEditMode,
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    advancedSubmit,
    pendingAwarenessUnavailable: pendingAwareness?.error !== undefined,
    pendingDraftSummary,
    pendingOverlap,
    discardChanges,
    publishChanges,
    getActionCount,
  };
}
