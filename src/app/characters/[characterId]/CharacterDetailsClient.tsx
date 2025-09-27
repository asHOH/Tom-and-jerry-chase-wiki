'use client';

import { CharacterDetails } from '@/components/displays/characters/character-detail';
import { CharacterDetailsProps } from '@/lib/types';
import { characters } from '@/data';
import { useEffect, useState, useCallback } from 'react';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import {
  hasUserSeenCharacterDetailsTutorial,
  resetCharacterDetailsTutorial,
} from '@/lib/tutorialUtils';
import { useEditMode } from '@/context/EditModeContext';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';
import { useCharacterNavigation } from '@/lib/hooks/useCharacterNavigation';
import { useKeyboardNavigation } from '@/lib/hooks/useKeyboardNavigation';
import SwipeNavigationIndicator from '@/components/ui/SwipeNavigationIndicator';
import { proxy } from 'valtio';

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

  // Touch gesture navigation
  const { previousCharacter, nextCharacter, navigateToPrevious, navigateToNext } =
    useCharacterNavigation(character.id);

  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (nextCharacter) {
        setSwipeDirection('right');
        setTimeout(() => {
          navigateToNext();
          setSwipeDirection(null);
        }, 200);
      }
    },
    onSwipeRight: () => {
      if (previousCharacter) {
        setSwipeDirection('left');
        setTimeout(() => {
          navigateToPrevious();
          setSwipeDirection(null);
        }, 200);
      }
    },
    threshold: 50,
    velocityThreshold: 0.3,
    disabled: isEditMode, // Disable swipe in edit mode to avoid conflicts
  });

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
      <div ref={swipeRef as React.RefObject<HTMLDivElement>} className='min-h-screen'>
        <CharacterDetails character={character} onTutorialTrigger={handleTutorialTrigger}>
          {props.children}
        </CharacterDetails>
      </div>

      <SwipeNavigationIndicator
        direction={swipeDirection}
        characterName={
          swipeDirection === 'left'
            ? previousCharacter?.character?.id
            : swipeDirection === 'right'
              ? nextCharacter?.character?.id
              : undefined
        }
      />

      {showTutorial && <OnboardingTutorial onClose={handleTutorialClose} isEnabled={isEditMode} />}
    </>
  );
}
