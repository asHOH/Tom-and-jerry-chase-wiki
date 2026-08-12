'use client';

import { ReactNode, useCallback, useEffect, useMemo } from 'react';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import {
  PublishedEntityHistoryProvider,
  type PublishedEntityHistoryEntry,
} from '@/context/PublishedEntityHistoryContext';
import { useToast } from '@/context/ToastContext';

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
  const {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    advancedSubmit,
    discardChanges,
    publishChanges,
    getActionCount,
  } = usePageEditMode({
    entityType,
    entityId,
    showToast: info,
    onPublishSuccess: showSubmissionFeedback,
  });
  const editMode = useEditMode();
  const { isEditMode, isPreviewMode, registerPublishedRevision } = editMode;

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
        submitMode?: GameDataSubmitMode;
      }
    ) => publishChanges(message, options),
    [publishChanges]
  );

  const content = publishedHistory ? (
    <PublishedEntityHistoryProvider history={publishedHistory}>
      {children}
    </PublishedEntityHistoryProvider>
  ) : (
    children
  );

  return (
    <>
      <EditModeContext value={editModeContextValue}>
        {withPageShell ? <PageShell width='maximum'>{content}</PageShell> : content}
      </EditModeContext>
      {isEditMode ? (
        <EditModeToolbar
          isDirty={isDirty}
          actionCount={getActionCount()}
          isPublishing={isPublishing}
          onDiscard={discardChanges}
          onPublish={handlePublish}
          advancedSubmit={advancedSubmit}
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
