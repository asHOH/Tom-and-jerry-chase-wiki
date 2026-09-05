'use client';

import { ReactNode, useCallback, useEffect, useMemo } from 'react';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import {
  PendingActionAwarenessProvider,
  usePendingActionAwarenessSource,
} from '@/context/PendingActionAwarenessContext';
import {
  PublishedEntityHistoryProvider,
  type PublishedEntityHistoryEntry,
} from '@/context/PublishedEntityHistoryContext';
import { useToast } from '@/context/ToastContext';
import type { SingleItemTypeName } from '@/data/types';

import EditModeToolbar from './EditModeToolbar';
import PageShell from './PageShell';

type EditModePageShellProps = {
  entityType: PublishableEntityType;
  entityId: string;
  entityName: string;
  publishedRevision?: `v1:${string}`;
  publishedHistory?: readonly PublishedEntityHistoryEntry[];
  withPageShell?: boolean;
  children: ReactNode;
};

const HISTORY_ITEM_TYPE_BY_ENTITY_TYPE: Partial<Record<PublishableEntityType, SingleItemTypeName>> =
  {
    characters: 'character',
    cards: 'knowledgeCard',
    specialSkills: 'specialSkill',
    items: 'item',
    entities: 'entity',
    buffs: 'buff',
    maps: 'map',
    fixtures: 'fixture',
    modes: 'mode',
    achievements: 'achievement',
  };

export default function EditModePageShell({
  entityType,
  entityId,
  entityName,
  publishedRevision,
  publishedHistory,
  withPageShell = true,
  children,
}: EditModePageShellProps) {
  const { exitEditMode } = useSearchParamEditMode();
  const { info } = useToast();
  const showSubmissionFeedback = useContributionSubmissionFeedback();
  const editMode = useEditMode();
  const { isEditMode, isPreviewMode, registerPublishedRevision } = editMode;
  const pendingAwareness = usePendingActionAwarenessSource({
    enabled: isEditMode && !isPreviewMode,
    entityType,
    ...(entityId.trim() ? { entityKey: entityId } : {}),
  });
  const {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    advancedSubmit,
    pendingAwarenessUnavailable,
    pendingDraftSummary,
    pendingOverlap,
    discardChanges,
    publishChanges,
    getActionCount,
  } = usePageEditMode({
    entityType,
    entityId,
    showToast: info,
    onPublishSuccess: showSubmissionFeedback,
    pendingAwareness,
  });

  useEffect(() => {
    if (!publishedRevision) return undefined;
    return registerPublishedRevision(publishedRevision);
  }, [publishedRevision, registerPublishedRevision]);

  const editModeContextValue = useMemo(
    () => ({
      ...editMode,
      isEditMode: isEditMode && !isPreviewMode,
      ...(publishedRevision === undefined ? {} : { publishedRevision }),
    }),
    [editMode, isEditMode, isPreviewMode, publishedRevision]
  );

  const handlePublish = useCallback(
    (
      message?: string,
      options?: {
        pendingAcknowledgementToken?: string;
        submitMode?: GameDataSubmitMode;
      }
    ) => publishChanges(message, options),
    [publishChanges]
  );

  const historyItemType = HISTORY_ITEM_TYPE_BY_ENTITY_TYPE[entityType];
  const content =
    publishedHistory && historyItemType ? (
      <PublishedEntityHistoryProvider
        history={publishedHistory}
        item={{ name: entityName, type: historyItemType }}
      >
        {children}
      </PublishedEntityHistoryProvider>
    ) : (
      children
    );

  return (
    <>
      <EditModeContext value={editModeContextValue}>
        <PendingActionAwarenessProvider source={pendingAwareness}>
          {withPageShell ? <PageShell width='maximum'>{content}</PageShell> : content}
        </PendingActionAwarenessProvider>
      </EditModeContext>
      {isEditMode ? (
        <EditModeToolbar
          isDirty={isDirty}
          actionCount={getActionCount()}
          isPublishing={isPublishing}
          onDiscard={discardChanges}
          onPublish={handlePublish}
          advancedSubmit={advancedSubmit}
          pendingAwarenessUnavailable={pendingAwarenessUnavailable}
          pendingDraftSummary={pendingDraftSummary}
          pendingOverlap={pendingOverlap}
          onExitEditMode={exitEditMode}
          entityName={entityName}
          draftInfo={draftInfo}
          draftsSummary={draftsSummary}
          isTutorialEnabled
        />
      ) : null}
    </>
  );
}
