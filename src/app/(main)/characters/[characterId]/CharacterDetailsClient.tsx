'use client';

import { useCallback, useEffect, useState } from 'react';

import { hasUserSeenCharacterDetailsTutorial } from '@/lib/tutorialUtils';
import { CharacterDetailsProps } from '@/lib/types';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
import { CharacterDetails } from '@/features/characters/components/character-detail';
import EditModeToolbar from '@/components/ui/EditModeToolbar';
import OnboardingTutorial from '@/components/OnboardingTutorial';

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  const { isEditMode } = useEditMode();
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
    discardChanges,
    publishChanges,
    getActionCount,
  } = usePageEditMode({
    entityType: 'characters',
    entityId: currentCharacterId,
    showToast: info,
  });
  const [showTutorial, setShowTutorial] = useState(false);

  // Keyboard navigation
  useKeyboardNavigation(currentCharacterId, isEditMode);

  useEffect(() => {
    if (isEditMode && !hasUserSeenCharacterDetailsTutorial()) {
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
    }
  }, [isEditMode]);

  const handleTutorialClose = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handlePublish = useCallback(
    (message?: string) => publishChanges(message),
    [publishChanges]
  );

  return (
    <>
      <div className='min-h-screen'>
        <CharacterDetails>{props.children}</CharacterDetails>
      </div>

      {showTutorial && (
        <OnboardingTutorial onClose={handleTutorialClose} isEnabled={showTutorial} />
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
            onExitEditMode={exitEditMode}
            entityName={currentCharacterId}
            draftInfo={draftInfo}
            draftsSummary={draftsSummary}
          />
        </>
      )}
    </>
  );
}
