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
import EditModeGuard from '@/components/ui/EditModeGuard';
import EditModeToolbar from '@/components/ui/EditModeToolbar';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import { characters } from '@/data';

const syncCharacterStoreEntry = (
  characterId: string,
  value: CharacterDetailsProps['character']
) => {
  const existing = characters[characterId];
  if (existing) {
    Object.assign(existing, value);
  } else {
    characters[characterId] = proxy(value);
  }
};

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  const { isEditMode } = useEditMode();
  const { characterId } = useLocalCharacter();
  const { exitEditMode } = useSearchParamEditMode();
  const { info } = useToast();

  // Page-level edit mode management
  const { isDirty, isPublishing, saveDraft, discardChanges, publishChanges, getActionCount } =
    usePageEditMode({
      entityType: 'characters',
      entityId: characterId || props.character.id,
      showToast: info,
    });

  const [character, setCharacter] = useState(() => {
    if (typeof window !== 'undefined' && !isEditMode) {
      syncCharacterStoreEntry(props.character.id, props.character);
    }
    return props.character;
  });
  useEffect(() => {
    if (isEditMode) {
      return;
    }

    syncCharacterStoreEntry(props.character.id, props.character);
    setCharacter(props.character);
  }, [props.character, isEditMode]);

  const [showTutorial, setShowTutorial] = useState(false);

  // Keyboard navigation
  useKeyboardNavigation(character.id, isEditMode);

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
    async (message?: string) => {
      await publishChanges(message);
    },
    [publishChanges]
  );

  return (
    <>
      <div className='min-h-screen'>
        <CharacterDetails character={character} onTutorialTrigger={handleTutorialTrigger}>
          {props.children}
        </CharacterDetails>
      </div>

      {showTutorial && <OnboardingTutorial onClose={handleTutorialClose} isEnabled={isEditMode} />}

      {/* Edit mode guard and toolbar */}
      {isEditMode && (
        <>
          <EditModeGuard
            isDirty={isDirty}
            onSaveDraft={saveDraft}
            onDiscardChanges={discardChanges}
            onExitEditMode={exitEditMode}
          />
          <EditModeToolbar
            isDirty={isDirty}
            actionCount={getActionCount()}
            isPublishing={isPublishing}
            onSaveDraft={saveDraft}
            onDiscard={discardChanges}
            onPublish={handlePublish}
            onExitEditMode={exitEditMode}
            entityName={character.id}
          />
        </>
      )}
    </>
  );
}
