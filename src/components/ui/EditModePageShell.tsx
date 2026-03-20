'use client';

import { ReactNode, useCallback } from 'react';

import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { usePageEditMode, type PublishableEntityType } from '@/context/EditModeContext';
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

  const handlePublish = useCallback(
    (message?: string) => publishChanges(message),
    [publishChanges]
  );

  return (
    <>
      {children}
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
