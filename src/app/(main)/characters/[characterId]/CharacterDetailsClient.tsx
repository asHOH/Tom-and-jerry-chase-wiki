'use client';

import { useCallback, useEffect, useState } from 'react';
import { proxy } from 'valtio';

import {
  hasUserSeenCharacterDetailsTutorial,
  resetCharacterDetailsTutorial,
} from '@/lib/tutorialUtils';
import { CharacterDetailsProps } from '@/lib/types';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { useEditMode, useLocalCharacter, usePageEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
import { CharacterDetails } from '@/features/characters/components/character-detail';
import EditModeToolbar from '@/components/ui/EditModeToolbar';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import { characters } from '@/data';

const syncCharacterStoreEntry = (
  characterId: string,
  value: CharacterDetailsProps['character']
) => {
  const nextValue = structuredClone(value) as Record<string, unknown>;
  const existing = characters[characterId];
  if (existing) {
    Object.keys(existing as Record<string, unknown>).forEach((key) => {
      if (!(key in nextValue)) {
        delete (existing as Record<string, unknown>)[key];
      }
    });
    Object.assign(existing as Record<string, unknown>, nextValue);
  } else {
    characters[characterId] = proxy(nextValue as CharacterDetailsProps['character']);
  }
};

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

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    syncCharacterStoreEntry(props.character.id, props.character);
  }, [props.character, isEditMode]);
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

  const handleTutorialTrigger = useCallback(() => {
    resetCharacterDetailsTutorial();
    setShowTutorial(true);
  }, []);

  const handlePublish = useCallback(
    (message?: string) => publishChanges(message),
    [publishChanges]
  );

  return (
    <>
      <div className='min-h-screen'>
        <CharacterDetails onTutorialTrigger={handleTutorialTrigger}>
          {props.children}
        </CharacterDetails>
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
