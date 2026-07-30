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
  squashActions,
  withRecordingSuppressed,
  writeActionHistory,
} from '@/lib/edit/diffUtils';
import {
  buildDraftSummaryItemsForType,
  sortDraftSummaryItems,
  type DraftSummaryItem,
} from '@/lib/edit/editModeDrafts';
import { getPublishErrorMessage } from '@/lib/gameData/publishErrorMessage';
import {
  getGameDataSubmitOutcomeFromResults,
  getGameDataSubmitSuccessMessage,
  resolveGameDataAdvancedSubmit,
  type GameDataAdvancedSubmit,
  type GameDataSubmitMode,
} from '@/lib/gameData/submitMode';
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
import { useToast } from '@/context/ToastContext';
import type { Json } from '@/data/database.types';

type RelationMatrixEditModeResult = {
  isDirty: boolean;
  isPublishing: boolean;
  draftInfo: { actionCount: number } | null;
  draftsSummary: DraftSummaryItem[];
  advancedSubmit: GameDataAdvancedSubmit;
  discardChanges: () => void;
  publishChanges: (
    message?: string,
    options?: {
      submitMode?: GameDataSubmitMode;
    }
  ) => Promise<boolean>;
  getActionCount: () => number;
};

const RELATION_ACTIONS_STORAGE_KEY = getActionsStorageKey('characters');

const writeRemainingCharacterActions = (remaining: ReturnType<typeof readActionHistory>) => {
  if (typeof window === 'undefined') return;

  if (remaining.length === 0) {
    window.localStorage.removeItem(RELATION_ACTIONS_STORAGE_KEY);
    return;
  }

  writeActionHistory(RELATION_ACTIONS_STORAGE_KEY, remaining);
};

const resolveCharacterLabel = (
  characters: Record<string, unknown>,
  { entityId }: { entityId: string }
) => {
  const character = characters[entityId] as { name?: string; id?: string } | undefined;
  return character?.name ?? character?.id ?? entityId;
};

export const useRelationMatrixEditMode = (): RelationMatrixEditModeResult => {
  const permissions = usePermissions();
  const { info, error } = useToast();
  const showSubmissionFeedback = useContributionSubmissionFeedback();
  const editRuntime = useActiveEditRuntime();
  const characters = editRuntime?.stores.characters;
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionCountTrigger, setActionCountTrigger] = useState(0);

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
    const { matching, remaining } = getRelationActions();
    const squashed = characters ? squashActions(matching, { currentRoot: characters }) : [];
    return { remaining, squashed };
  }, [characters, getRelationActions]);

  const squashedRelationActions = useMemo(() => {
    void actionCountTrigger;
    return getPublishDraft().squashed;
  }, [actionCountTrigger, getPublishDraft]);

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

    writeRemainingCharacterActions(remaining);
    setActionCountTrigger((current) => current + 1);
    info('已放弃关系修改');
  }, [characters, getRelationActions, info]);

  const publishChanges = useCallback(
    async (
      message?: string,
      options?: {
        submitMode?: GameDataSubmitMode;
      }
    ): Promise<boolean> => {
      if (!characters) {
        error('编辑数据尚未就绪');
        return false;
      }
      const { remaining, squashed } = getPublishDraft();

      if (squashed.length === 0) {
        writeRemainingCharacterActions(remaining);
        setActionCountTrigger((current) => current + 1);
        info('没有需要发布的关系修改');
        return false;
      }

      setIsPublishing(true);
      try {
        const response = await fetch('/api/game-data-actions/publish-relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: squashed, message, submitMode: options?.submitMode }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
            message?: string;
            requestId?: string;
          } | null;
          throw new Error(getPublishErrorMessage(body, '发布失败'));
        }
        const body = (await response.json().catch(() => null)) as {
          result?: Array<{
            is_public: boolean;
            status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';
          }>;
        } | null;

        writeRemainingCharacterActions(remaining);
        setActionCountTrigger((current) => current + 1);
        showSubmissionFeedback(
          getGameDataSubmitSuccessMessage(
            '关系修改',
            getGameDataSubmitOutcomeFromResults(body?.result ?? [])
          )
        );
        return true;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : '发布失败';
        error(message);
        return false;
      } finally {
        setIsPublishing(false);
      }
    },
    [characters, error, getPublishDraft, info, showSubmissionFeedback]
  );

  return {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    advancedSubmit,
    discardChanges,
    publishChanges,
    getActionCount,
  };
};
