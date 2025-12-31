'use client';

import { useCallback, useEffect, useState } from 'react';
import { proxy } from 'valtio';

import {
  hasUserSeenCharacterDetailsTutorial,
  resetCharacterDetailsTutorial,
} from '@/lib/tutorialUtils';
import { CharacterDetailsProps } from '@/lib/types';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useEditMode } from '@/context/EditModeContext';
import { CharacterDetails } from '@/features/characters/components/character-detail';
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

  return (
    <>
      <div className='min-h-screen'>
        <CharacterDetails character={character} onTutorialTrigger={handleTutorialTrigger}>
          {props.children}
        </CharacterDetails>
      </div>

      {showTutorial && <OnboardingTutorial onClose={handleTutorialClose} isEnabled={isEditMode} />}
    </>
  );
}
