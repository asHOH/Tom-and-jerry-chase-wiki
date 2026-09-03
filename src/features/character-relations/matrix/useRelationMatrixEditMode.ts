'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { subscribe } from 'valtio';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import { useActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import { splitCharacterRelationActionHistory } from '@/lib/edit/characterRelationActions';
import {
  applyActionEntry,
  getActionsStorageKey,
  invertActionEntry,
  readActionHistory,
  replaceActionHistory,
  squashActions,
  withRecordingSuppressed,
} from '@/lib/edit/diffUtils';
import {
  buildDraftSummaryItemsForType,
  sortDraftSummaryItems,
  type DraftSummaryItem,
} from '@/lib/edit/editModeDrafts';
import { reconcilePublishHistory } from '@/lib/edit/publishHistory';
import type {
  PendingActionOverlapResponse,
  PendingActionOverlapSummary,
} from '@/lib/gameData/pendingActionAwarenessTypes';
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
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
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

const RELATION_ACTIONS_STORAGE_KEY = getActionsStorageKey('characters');
const RELATION_PUBLISH_OPERATION_SCOPE = 'relations:characters';

const resolveCharacterLabel = (
  characters: Record<string, unknown>,
  { entityId }: { entityId: string }
) => {
  const character = characters[entityId] as { name?: string; id?: string } | undefined;
  return character?.name ?? character?.id ?? entityId;
};

export const useRelationMatrixEditMode = (
  pendingAwareness?: PendingActionAwarenessSource
): RelationMatrixEditModeResult => {
  const permissions = usePermissions();
  const { info, error } = useToast();
  const showSubmissionFeedback = useContributionSubmissionFeedback();
  const editRuntime = useActiveEditRuntime();
  const characters = editRuntime?.stores.characters;
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionCountTrigger, setActionCountTrigger] = useState(0);
  const [pendingOverlap, setPendingOverlap] = useState<PendingActionOverlapResponse | null>(null);

  useEffect(() => {
    if (!characters) return;
    const unsubscribe = subscribe(characters, () => {
      setActionCountTrigger((current) => current + 1);
    });

    return unsubscribe;
  }, [characters]);

  const getRelationActions = useCallback(() => {
    const history = readActionHistory(RELATION_ACTIONS_STORAGE_KEY);
    return splitCharacterRelationActionHistory(history);
  }, []);

  const getActionCount = useCallback((): number => {
    if (!characters) return 0;
    const { matching } = getRelationActions();
    return squashActions(matching, { currentRoot: characters }).length;
  }, [characters, getRelationActions]);

  const getPublishDraft = useCallback(() => {
    const source = readActionHistory(RELATION_ACTIONS_STORAGE_KEY);
    const { matching, remaining } = splitCharacterRelationActionHistory(source);
    const squashed = characters ? squashActions(matching, { currentRoot: characters }) : [];
    return { source, remaining, squashed };
  }, [characters]);

  const squashedRelationActions = useMemo(() => {
    void actionCountTrigger;
    return getPublishDraft().squashed;
  }, [actionCountTrigger, getPublishDraft]);
  const flattenedSquashedActions = useMemo(
    () => squashedRelationActions.flatMap((entry) => (Array.isArray(entry) ? entry : [entry])),
    [squashedRelationActions]
  );
  const pendingDraftSummary = useMemo(
    () => pendingAwareness?.summarizeActions(flattenedSquashedActions) ?? null,
    [flattenedSquashedActions, pendingAwareness]
  );

  useEffect(() => {
    setPendingOverlap(null);
  }, [squashedRelationActions]);

  const isDirty = squashedRelationActions.length > 0;
  const draftInfo = isDirty ? { actionCount: squashedRelationActions.length } : null;
  const draftsSummary = useMemo(
    () =>
      sortDraftSummaryItems(
        buildDraftSummaryItemsForType('characters', squashedRelationActions, (item) =>
          resolveCharacterLabel(characters ?? {}, item)
        )
      ),
    [characters, squashedRelationActions]
  );
  const advancedSubmit = useMemo(
    () =>
      resolveGameDataAdvancedSubmit({
        entityType: 'characters',
        entries: squashedRelationActions as unknown as Json[],
        canAll: permissions.canAll,
      }),
    [permissions, squashedRelationActions]
  );

  const discardChanges = useCallback(() => {
    if (!characters) return;
    const { matching, remaining } = getRelationActions();

    if (matching.length > 0) {
      withRecordingSuppressed(RELATION_ACTIONS_STORAGE_KEY, () => {
        for (let i = matching.length - 1; i >= 0; i -= 1) {
          applyActionEntry(characters, invertActionEntry(matching[i]!));
        }
      });
    }

    const cleanupSucceeded =
      typeof window === 'undefined' ||
      replaceActionHistory(RELATION_ACTIONS_STORAGE_KEY, remaining);
    if (cleanupSucceeded) {
      clearPublishOperation(RELATION_PUBLISH_OPERATION_SCOPE);
      info('已放弃关系修改');
    } else {
      error('放弃关系修改后本地草稿清理失败，请重试');
    }
    setActionCountTrigger((current) => current + 1);
  }, [characters, error, getRelationActions, info]);

  const publishChanges = useCallback(
    async (
      message?: string,
      options?: {
        pendingAcknowledgementToken?: string;
        submitMode?: GameDataSubmitMode;
      }
    ): Promise<boolean> => {
      if (!characters) {
        error('编辑数据尚未就绪');
        return false;
      }
      const { source, remaining, squashed } = getPublishDraft();

      if (squashed.length === 0) {
        const cleanupSucceeded =
          typeof window === 'undefined' ||
          replaceActionHistory(RELATION_ACTIONS_STORAGE_KEY, remaining);
        if (cleanupSucceeded) {
          clearPublishOperation(RELATION_PUBLISH_OPERATION_SCOPE);
          info('没有需要发布的关系修改');
        } else {
          error('本地关系草稿清理失败，请重试');
        }
        setActionCountTrigger((current) => current + 1);
        return false;
      }

      const fingerprint = getPublishOperationFingerprint({
        endpoint: '/api/game-data-actions/publish-relations',
        entries: squashed,
        message: message?.trim() || null,
        submitMode: options?.submitMode ?? 'default',
      });
      setIsPublishing(true);
      try {
        const operationId = getOrCreatePublishOperationId(
          RELATION_PUBLISH_OPERATION_SCOPE,
          fingerprint
        );
        const response = await fetch('/api/game-data-actions/publish-relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': operationId },
          body: JSON.stringify({
            entries: squashed,
            message,
            pendingAcknowledgementToken: options?.pendingAcknowledgementToken,
            submitMode: options?.submitMode,
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
            message?: string;
            requestId?: string;
          } | null;
          if (
            response.status === 409 &&
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
            error('检测到与待审核改动重叠的字段，请确认风险后重试');
            return false;
          }
          throw new Error(getPublishErrorMessage(body, '发布失败'));
        }
        const body = (await response.json().catch(() => null)) as {
          result?: Array<{
            is_public: boolean;
            status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';
          }>;
        } | null;

        const latest = readActionHistory(RELATION_ACTIONS_STORAGE_KEY);
        const reconciled = reconcilePublishHistory(source, remaining, latest);
        const cleanupSucceeded =
          reconciled !== null &&
          (typeof window === 'undefined' ||
            replaceActionHistory(RELATION_ACTIONS_STORAGE_KEY, reconciled));
        if (cleanupSucceeded) clearPublishOperation(RELATION_PUBLISH_OPERATION_SCOPE);
        setPendingOverlap(null);
        setActionCountTrigger((current) => current + 1);
        try {
          await pendingAwareness?.refresh();
        } catch (refreshError) {
          console.warn('Failed to refresh pending action awareness after publish.', refreshError);
        }
        showSubmissionFeedback(
          getGameDataSubmitSuccessMessage(
            '关系修改',
            getGameDataSubmitOutcomeFromResults(body?.result ?? [])
          )
        );
        if (!cleanupSucceeded) {
          error(
            reconciled === null
              ? '发布成功，但本地草稿历史已变化，未清理已发布关系草稿，请确认后重试。'
              : '发布成功，但本地关系草稿清理失败，请确认后重试。'
          );
          return false;
        }

        return splitCharacterRelationActionHistory(reconciled).matching.length === 0;
      } catch (caught) {
        if (caught instanceof PublishOperationConflictError) {
          error('当前发布操作仍待处理，请先完成清理或放弃草稿后再提交不同修改。');
          return false;
        }
        const message = caught instanceof Error ? caught.message : '发布失败';
        error(message);
        return false;
      } finally {
        setIsPublishing(false);
      }
    },
    [characters, error, getPublishDraft, info, pendingAwareness, showSubmissionFeedback]
  );

  return {
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
};
