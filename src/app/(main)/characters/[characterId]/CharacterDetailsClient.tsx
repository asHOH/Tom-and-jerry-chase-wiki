'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { hasUserSeenTutorial } from '@/lib/tutorialUtils';
import { CharacterDetailsProps } from '@/lib/types';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
import { useRelationMatrixEditMode } from '@/features/character-relations/matrix/useRelationMatrixEditMode';
import { CharacterDetails } from '@/features/characters/components/character-detail';
import EditModeToolbar from '@/components/ui/EditModeToolbar';
import OnboardingTutorial from '@/components/OnboardingTutorial';

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  const { isEditMode, isLoading, isPreviewMode, setIsPreviewMode } = useEditMode();
  const { characterId } = useLocalCharacter();
  const { exitEditMode } = useSearchParamEditMode();
  const { info } = useToast();
  const currentCharacterId = characterId || props.character.id;

  // Page-level edit mode management
  const characterEditMode = usePageEditMode({
    entityType: 'characters',
    entityId: currentCharacterId,
    showToast: info,
  });
  const relationEditMode = useRelationMatrixEditMode(currentCharacterId);
  const isDirty = characterEditMode.isDirty || relationEditMode.isDirty;
  const isPublishing = characterEditMode.isPublishing || relationEditMode.isPublishing;
  const actionCount = characterEditMode.getActionCount() + relationEditMode.getActionCount();
  const draftInfo = actionCount > 0 ? { actionCount } : null;
  const draftsSummary = useMemo(
    () => [
      ...characterEditMode.draftsSummary.filter((item) => item.entityType !== 'characterRelations'),
      ...relationEditMode.draftsSummary,
    ],
    [characterEditMode.draftsSummary, relationEditMode.draftsSummary]
  );
  const [showCharacterTutorial, setShowCharacterTutorial] = useState(false);
  const [isToolbarTutorialEnabled, setIsToolbarTutorialEnabled] = useState(false);

  // Keyboard navigation
  useKeyboardNavigation(currentCharacterId, isEditMode);

  useEffect(() => {
    if (!isEditMode) {
      setShowCharacterTutorial(false);
      setIsToolbarTutorialEnabled(false);
      return;
    }

    const shouldShowCharacterTutorial = !hasUserSeenTutorial('character-edit');
    setShowCharacterTutorial(shouldShowCharacterTutorial);
    setIsToolbarTutorialEnabled(!shouldShowCharacterTutorial);
  }, [isEditMode]);

  const handleTutorialClose = useCallback(() => {
    setShowCharacterTutorial(false);
    setIsToolbarTutorialEnabled(true);
  }, []);

  const handlePublish = useCallback(
    async (message?: string) => {
      const characterPublished = characterEditMode.isDirty
        ? await characterEditMode.publishChanges(message)
        : true;
      const relationsPublished = relationEditMode.isDirty
        ? await relationEditMode.publishChanges(message)
        : true;
      return characterPublished && relationsPublished;
    },
    [characterEditMode, relationEditMode]
  );
  const handleDiscard = useCallback(() => {
    if (characterEditMode.isDirty) characterEditMode.discardChanges();
    if (relationEditMode.isDirty) relationEditMode.discardChanges();
  }, [characterEditMode, relationEditMode]);
  const editModeContextValue = useMemo(
    () => ({
      isEditMode: isEditMode && !isPreviewMode,
      isLoading,
      isPreviewMode,
      setIsPreviewMode,
    }),
    [isEditMode, isLoading, isPreviewMode, setIsPreviewMode]
  );

  return (
    <>
      <div className='min-h-screen'>
        <EditModeContext value={editModeContextValue}>
          <CharacterDetails>{props.children}</CharacterDetails>
        </EditModeContext>
      </div>

      {showCharacterTutorial && (
        <OnboardingTutorial
          tutorial='character-edit'
          onClose={handleTutorialClose}
          isEnabled={showCharacterTutorial}
        />
      )}

      {/* Edit mode toolbar */}
      {isEditMode && (
        <>
          <EditModeToolbar
            isDirty={isDirty}
            actionCount={actionCount}
            isPublishing={isPublishing}
            onDiscard={handleDiscard}
            onPublish={handlePublish}
            onExitEditMode={exitEditMode}
            entityName={currentCharacterId}
            draftInfo={draftInfo}
            draftsSummary={draftsSummary}
            isTutorialEnabled={isToolbarTutorialEnabled}
          />
        </>
      )}
    </>
  );
}
