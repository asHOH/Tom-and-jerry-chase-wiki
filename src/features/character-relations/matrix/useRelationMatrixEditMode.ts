'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import {
  buildDraftSummaryItemsForType,
  sortDraftSummaryItems,
  type DraftSummaryItem,
} from '@/lib/edit/editModeDrafts';
import { EditDraftCleanupError } from '@/lib/edit/editSession';
import type {
  PendingActionOverlapResponse,
  PendingActionOverlapSummary,
} from '@/lib/gameData/pendingActionAwarenessTypes';
import { PublishOperationConflictError } from '@/lib/gameData/publishOperation';
import {
  getGameDataSubmitSuccessMessage,
  resolveGameDataAdvancedSubmit,
  type GameDataAdvancedSubmit,
  type GameDataSubmitMode,
} from '@/lib/gameData/submitMode';
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
import { useEditDraft } from '@/hooks/useEditDraft';
import type { PendingActionAwarenessSource } from '@/context/PendingActionAwarenessContext';
import { useToast } from '@/context/ToastContext';
import type { Json } from '@/data/database.types';

type RelationMatrixEditModeResult = {
  isDirty: boolean;
  isPublishing: boolean;
  draftInfo: { actionCount: number } | null;
  draftsSummary: DraftSummaryItem[];
  advancedSubmit: GameDataAdvancedSubmit;
  pendingAwarenessUnavailable: boolean;
  pendingDraftSummary: PendingActionOverlapSummary | null;
  pendingOverlap: PendingActionOverlapResponse | null;
  discardChanges: () => void;
  publishChanges: (
    message?: string,
    options?: {
      pendingAcknowledgementToken?: string;
      submitMode?: GameDataSubmitMode;
    }
  ) => Promise<boolean>;
  getActionCount: () => number;
};

const RELATION_SCOPE = { kind: 'character-relations' } as const;

export const useRelationMatrixEditMode = (
  pendingAwareness?: PendingActionAwarenessSource
): RelationMatrixEditModeResult => {
  const permissions = usePermissions();
  const { info, error } = useToast();
  const showSubmissionFeedback = useContributionSubmissionFeedback();
  const { state, overview, discardDraft, publishDraft, getActionCount } =
    useEditDraft(RELATION_SCOPE);
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
  const draftsSummary = useMemo(() => {
    const labels = new Map(
      overview
        .filter((item) => item.entityType === 'characters')
        .map((item) => [item.entityId, item.itemLabel])
    );
    return sortDraftSummaryItems(
      buildDraftSummaryItemsForType('characters', [...state.publishEntries], ({ entityId }) =>
        labels.get(entityId)
      )
    );
  }, [overview, state.publishEntries]);
  const advancedSubmit = useMemo(
    () =>
      resolveGameDataAdvancedSubmit({
        entityType: 'characters',
        entries: state.publishEntries as unknown as Json[],
        canAll: permissions.canAll,
      }),
    [permissions, state.publishEntries]
  );

  useEffect(() => setPendingOverlap(null), [draftFingerprint]);

  const discardChanges = useCallback(() => {
    const result = discardDraft();
    if (result.status === 'discarded') info('已放弃关系修改');
    else error('放弃关系修改后本地草稿清理失败，请重试');
  }, [discardDraft, error, info]);

  const refreshAwareness = useCallback(async () => {
    try {
      await pendingAwareness?.refresh();
    } catch (caught) {
      console.warn('Failed to refresh pending action awareness after publish.', caught);
    }
  }, [pendingAwareness]);

  const publishChanges = useCallback(
    async (
      message?: string,
      options?: {
        pendingAcknowledgementToken?: string;
        submitMode?: GameDataSubmitMode;
      }
    ): Promise<boolean> => {
      setIsPublishing(true);
      try {
        const result = await publishDraft({
          ...(message === undefined ? {} : { message }),
          ...options,
        });
        if (result.status === 'empty') {
          info('没有需要发布的关系修改');
          return false;
        }
        if (result.status === 'pending-conflict') {
          setPendingOverlap(result.conflict);
          await refreshAwareness();
          error('检测到与待审核改动重叠的字段，请确认风险后重试');
          return false;
        }
        if (result.status === 'failed') {
          error(
            result.error instanceof EditDraftCleanupError
              ? '本地关系草稿清理失败，请重试'
              : result.error instanceof PublishOperationConflictError
                ? '当前发布操作仍待处理，请先完成清理或放弃草稿后再提交不同修改。'
                : result.error.message
          );
          return false;
        }

        setPendingOverlap(null);
        await refreshAwareness();
        showSubmissionFeedback(getGameDataSubmitSuccessMessage('关系修改', result.outcome));
        if (result.status === 'cleanup-conflict') {
          error(
            result.reason === 'history-diverged'
              ? '发布成功，但本地草稿历史已变化，未清理已发布关系草稿，请确认后重试。'
              : '发布成功，但本地关系草稿清理失败，请确认后重试。'
          );
          return false;
        }
        return getActionCount() === 0;
      } finally {
        setIsPublishing(false);
      }
    },
    [error, getActionCount, info, publishDraft, refreshAwareness, showSubmissionFeedback]
  );

  return {
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
};
