'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { subscribe } from 'valtio';

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
import { useToast } from '@/context/ToastContext';
import { characters } from '@/data/store';

type RelationMatrixEditModeResult = {
  isDirty: boolean;
  isPublishing: boolean;
  draftInfo: { actionCount: number } | null;
  draftsSummary: DraftSummaryItem[];
  discardChanges: () => void;
  publishChanges: (message?: string) => Promise<boolean>;
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

const resolveCharacterLabel = ({ entityId }: { entityId: string }) => {
  const character = characters[entityId] as { name?: string; id?: string } | undefined;
  return character?.name ?? character?.id ?? entityId;
};

export const useRelationMatrixEditMode = (): RelationMatrixEditModeResult => {
  const { info, success, error } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionCountTrigger, setActionCountTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe(characters, () => {
      setActionCountTrigger((current) => current + 1);
    });

    return unsubscribe;
  }, []);

  const getRelationActions = useCallback(() => {
    const history = readActionHistory(RELATION_ACTIONS_STORAGE_KEY);
    return splitCharacterRelationActionHistory(history);
  }, []);

  const getActionCount = useCallback((): number => {
    const { matching } = getRelationActions();
    return squashActions(matching).length;
  }, [getRelationActions]);

  const squashedRelationActions = useMemo(() => {
    void actionCountTrigger;
    const { matching } = getRelationActions();
    return squashActions(matching);
  }, [actionCountTrigger, getRelationActions]);

  const isDirty = squashedRelationActions.length > 0;
  const draftInfo = isDirty ? { actionCount: squashedRelationActions.length } : null;
  const draftsSummary = useMemo(
    () =>
      sortDraftSummaryItems(
        buildDraftSummaryItemsForType('characters', squashedRelationActions, resolveCharacterLabel)
      ),
    [squashedRelationActions]
  );

  const discardChanges = useCallback(() => {
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
  }, [getRelationActions, info]);

  const publishChanges = useCallback(
    async (message?: string): Promise<boolean> => {
      const { matching, remaining } = getRelationActions();
      const squashed = squashActions(matching);

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
          body: JSON.stringify({ entries: squashed, message }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || '发布失败');
        }

        writeRemainingCharacterActions(remaining);
        setActionCountTrigger((current) => current + 1);
        success('关系修改已提交，等待审核');
        return true;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : '发布失败';
        error(message);
        return false;
      } finally {
        setIsPublishing(false);
      }
    },
    [error, getRelationActions, info, success]
  );

  return {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    discardChanges,
    publishChanges,
    getActionCount,
  };
};
