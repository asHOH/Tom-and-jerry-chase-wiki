'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import { sortDraftSummaryItems, type DraftSummaryItem } from '@/lib/edit/editModeDrafts';
import {
  EditDraftCleanupError,
  type EditDraftScope,
  type EditEntityRef,
} from '@/lib/edit/editSession';
import type {
  PendingActionOverlapResponse,
  PendingActionOverlapSummary,
} from '@/lib/gameData/pendingActionAwarenessTypes';
import { getGameDataEntityLabel } from '@/lib/gameData/presentation';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { PublishOperationConflictError } from '@/lib/gameData/publishOperation';
import {
  getGameDataSubmitSuccessMessage,
  resolveGameDataAdvancedSubmit,
  type GameDataAdvancedSubmit,
  type GameDataSubmitMode,
} from '@/lib/gameData/submitMode';
import { useEditDraft } from '@/hooks/useEditDraft';
import { useEditMode } from '@/context/EditModeContext';
import type { PendingActionAwarenessSource } from '@/context/PendingActionAwarenessContext';
import type { Json } from '@/data/database.types';
import type { FactionId } from '@/data/types';

export type PageEditModeOptions = {
  entityType: PublishableEntityType;
  entityId: string;
  showToast?: (message: string, duration?: number) => void;
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
  discardChanges: (options?: { showToast?: boolean }) => void;
  publishChanges: (
    message?: string,
    options?: {
      pendingAcknowledgementToken?: string;
      submitMode?: GameDataSubmitMode;
    }
  ) => Promise<boolean>;
  getActionCount: () => number;
};

function pageDraftScope(entityType: PublishableEntityType, entityId: string): EditDraftScope {
  if (!entityId) return { kind: 'domain', entityType };
  if (entityType === 'achievements' || entityType === 'specialSkills') {
    const separator = entityId.indexOf('.');
    const factionId = entityId.slice(0, separator) as FactionId;
    const scopedEntityId = entityId.slice(separator + 1);
    return {
      kind: 'entity',
      entity: { entityType, entityId: scopedEntityId, factionId } as EditEntityRef,
    };
  }
  return { kind: 'entity', entity: { entityType, entityId } as EditEntityRef };
}

export function usePageEditMode(options: PageEditModeOptions): PageEditModeResult {
  const { entityType, showToast, onPublishSuccess, pendingAwareness } = options;
  const entityKey = options.entityId.trim();
  const scope = useMemo(() => pageDraftScope(entityType, entityKey), [entityKey, entityType]);
  const { isReady, state, overview, discardDraft, publishDraft, getActionCount } =
    useEditDraft(scope);
  const permissions = usePermissions();
  const { isEditMode: originalIsEditMode, isPreviewMode } = useEditMode();
  const isEditMode = originalIsEditMode && !isPreviewMode;
  const previousEditMode = useRef(isEditMode);
  const restoredDraftShown = useRef(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pendingOverlap, setPendingOverlap] = useState<PendingActionOverlapResponse | null>(null);
  const flattenedDraft = useMemo(
    () => state.publishEntries.flatMap((entry) => (Array.isArray(entry) ? entry : [entry])),
    [state.publishEntries]
  );
  const pendingDraftSummary = useMemo(
    () => pendingAwareness?.summarizeActions(flattenedDraft) ?? null,
    [flattenedDraft, pendingAwareness]
  );
  const draftFingerprint = JSON.stringify(state.publishEntries);
  const draftsSummary = useMemo(
    () =>
      sortDraftSummaryItems(
        overview.map((item) => ({
          entityType: item.entityType,
          entityLabel: getGameDataEntityLabel(item.entityType),
          entityId: item.entityId,
          itemLabel: item.itemLabel,
          count: item.actionCount,
          ...(item.factionId ? { factionId: item.factionId } : {}),
        }))
      ),
    [overview]
  );
  const advancedSubmit = useMemo(
    () =>
      resolveGameDataAdvancedSubmit({
        entityType,
        entries: state.publishEntries as unknown as Json[],
        canAll: permissions.canAll,
      }),
    [entityType, permissions, state.publishEntries]
  );

  useEffect(() => setPendingOverlap(null), [draftFingerprint]);

  useEffect(() => {
    if (!isEditMode || !isReady || restoredDraftShown.current) return;
    if (state.actionCount > 0) showToast?.(`已恢复草稿 (${state.actionCount} 条修改)`, 4000);
    restoredDraftShown.current = true;
  }, [isEditMode, isReady, showToast, state.actionCount]);

  const discardChanges = useCallback(
    (discardOptions?: { showToast?: boolean }) => {
      const result = discardDraft();
      if (discardOptions?.showToast === false) return;
      showToast?.(
        result.status === 'discarded' ? '已放弃所有修改' : '放弃修改后本地草稿清理失败，请重试'
      );
    },
    [discardDraft, showToast]
  );

  useEffect(() => {
    const wasEditMode = previousEditMode.current;
    previousEditMode.current = originalIsEditMode;
    if (originalIsEditMode) return;
    restoredDraftShown.current = false;
    if (wasEditMode) discardChanges({ showToast: false });
  }, [discardChanges, originalIsEditMode]);

  const refreshAwareness = useCallback(async () => {
    try {
      await pendingAwareness?.refresh();
    } catch (error) {
      console.warn('Failed to refresh pending action awareness after publish.', error);
    }
  }, [pendingAwareness]);

  const publishChanges = useCallback(
    async (
      message?: string,
      publishOptions?: {
        pendingAcknowledgementToken?: string;
        submitMode?: GameDataSubmitMode;
      }
    ): Promise<boolean> => {
      setIsPublishing(true);
      try {
        const result = await publishDraft({
          ...(message === undefined ? {} : { message }),
          ...publishOptions,
        });
        if (result.status === 'empty') {
          showToast?.('没有需要发布的修改');
          return false;
        }
        if (result.status === 'pending-conflict') {
          setPendingOverlap(result.conflict);
          await refreshAwareness();
          showToast?.('检测到与待审核改动重叠的字段，请确认风险后重试');
          return false;
        }
        if (result.status === 'failed') {
          showToast?.(
            result.error instanceof EditDraftCleanupError
              ? '本地草稿清理失败，请重试'
              : result.error instanceof PublishOperationConflictError
                ? '当前发布操作仍待处理，请先完成清理或放弃草稿后再提交不同修改。'
                : result.error.message
          );
          return false;
        }

        setPendingOverlap(null);
        await refreshAwareness();
        const successMessage = getGameDataSubmitSuccessMessage('改动', result.outcome);
        if (onPublishSuccess) onPublishSuccess(successMessage);
        else showToast?.(successMessage);

        if (result.status === 'cleanup-conflict') {
          showToast?.(
            result.reason === 'history-diverged'
              ? '发布成功，但本地草稿历史已变化，未清理已发布草稿，请确认后重试。'
              : '发布成功，但本地草稿清理失败，请确认后重试。'
          );
          return false;
        }
        return getActionCount() === 0;
      } finally {
        setIsPublishing(false);
      }
    },
    [getActionCount, onPublishSuccess, publishDraft, refreshAwareness, showToast]
  );

  return {
    isEditMode,
    isDirty: state.actionCount > 0,
    isPublishing,
    draftInfo: state.actionCount > 0 ? { actionCount: state.actionCount } : null,
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
