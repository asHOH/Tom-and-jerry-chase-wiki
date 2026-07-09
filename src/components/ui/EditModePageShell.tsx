'use client';

import { ReactNode, useCallback, useMemo } from 'react';

import type { PublishableEntityType } from '@/lib/edit/editModeRegistry';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';

import EditModeToolbar from './EditModeToolbar';

type EditModePageShellProps = {
  entityType: PublishableEntityType;
  entityId: string;
  entityName: string;
  children: ReactNode;
};

export default function EditModePageShell({
  entityType,
  entityId,
  entityName,
  children,
}: EditModePageShellProps) {
  const { exitEditMode } = useSearchParamEditMode();
  const { info } = useToast();
  const {
    isEditMode,
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    discardChanges,
    publishChanges,
    getActionCount,
  } = usePageEditMode({
    entityType,
    entityId,
    showToast: info,
  });
  const { isLoading, isPreviewMode, setIsPreviewMode } = useEditMode();
  const editModeContextValue = useMemo(
    () => ({
      isEditMode: isEditMode && !isPreviewMode,
      isLoading,
      isPreviewMode,
      setIsPreviewMode,
    }),
    [isEditMode, isLoading, isPreviewMode, setIsPreviewMode]
  );

  const handlePublish = useCallback(
    (message?: string) => publishChanges(message),
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
          onExitEditMode={exitEditMode}
          entityName={entityName}
          draftInfo={draftInfo}
          draftsSummary={draftsSummary}
        />
      ) : null}
    </>
  );
}
