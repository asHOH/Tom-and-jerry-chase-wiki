'use client';

import { ReactNode, useCallback, useMemo } from 'react';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';

import EditModeToolbar from './EditModeToolbar';

type EditModePageShellProps = {
  entityType: PublishableEntityType;
  entityId: string;
  entityName: string;
  publishedRevision?: `v1:${string}`;
  children: ReactNode;
};

export default function EditModePageShell({
  entityType,
  entityId,
  entityName,
  publishedRevision,
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
  const { isEditMode, isLoading, isPreviewMode, setIsPreviewMode } = useEditMode();
  const editModeContextValue = useMemo(
    () => ({
      isEditMode: isEditMode && !isPreviewMode,
      isLoading,
      isPreviewMode,
      setIsPreviewMode,
      ...(publishedRevision === undefined ? {} : { publishedRevision }),
    }),
    [isEditMode, isLoading, isPreviewMode, publishedRevision, setIsPreviewMode]
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
      <EditModeContext value={editModeContextValue}>{children}</EditModeContext>
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
