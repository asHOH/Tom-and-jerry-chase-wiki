'use client';

import { ReactNode, useCallback, useEffect, useMemo } from 'react';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import {
  PublishedEntityHistoryProvider,
  type PublishedEntityHistoryEntry,
} from '@/context/PublishedEntityHistoryContext';
import { useToast } from '@/context/ToastContext';

import EditModeToolbar from './EditModeToolbar';

type EditModePageShellProps = {
  entityType: PublishableEntityType;
  entityId: string;
  entityName: string;
  publishedRevision?: `v1:${string}`;
  publishedHistory?: readonly PublishedEntityHistoryEntry[];
  children: ReactNode;
};

export default function EditModePageShell({
  entityType,
  entityId,
  entityName,
  publishedRevision,
  publishedHistory,
  children,
}: EditModePageShellProps) {
  const { exitEditMode } = useSearchParamEditMode();
  const { info } = useToast();
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

  return (
    <>
      <EditModeContext value={editModeContextValue}>
        {publishedHistory ? (
          <PublishedEntityHistoryProvider history={publishedHistory}>
            {children}
          </PublishedEntityHistoryProvider>
        ) : (
          children
        )}
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
