'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { hasUserSeenTutorial } from '@/lib/tutorialUtils';
import { CharacterDetailsProps } from '@/lib/types';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
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
    entityType: 'characters',
    entityId: currentCharacterId,
    showToast: info,
  });
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
    (
      message?: string,
      options?: {
        submitMode?: GameDataSubmitMode;
      }
    ) => publishChanges(message, options),
    [publishChanges]
  );
  const editModeContextValue = useMemo(
    () => ({
      isEditMode: isEditMode && !isPreviewMode,
      isLoading,
      isPreviewMode,
      setIsPreviewMode,
      ...(props.publishedRevision === undefined
        ? {}
        : { publishedRevision: props.publishedRevision }),
    }),
    [isEditMode, isLoading, isPreviewMode, props.publishedRevision, setIsPreviewMode]
  );

  return (
    <>
      <div className='min-h-screen'>
        <EditModeContext value={editModeContextValue}>
          <CharacterDetails character={props.character}>{props.children}</CharacterDetails>
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
            actionCount={getActionCount()}
            isPublishing={isPublishing}
            onDiscard={discardChanges}
            onPublish={handlePublish}
            advancedSubmit={advancedSubmit}
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
