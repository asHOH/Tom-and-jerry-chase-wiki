'use client';

import { CharacterDetails } from '@/components/displays/characters/character-detail';
import { CharacterDetailsProps } from '@/lib/types';
import { characters } from '@/data';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
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
import { GameDataManager } from '@/lib/dataManager';
import { proxy } from 'valtio';

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  const [character, setCharacter] = useState(props.character);
  const pathname = usePathname();
  const { isEditMode } = useEditMode();

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    try {
      const pathParts = pathname.split('/');
      const characterId = decodeURIComponent(pathParts[pathParts.length - 1] || '');
      GameDataManager.invalidate({ characters: true, factions: true });
      const canonicalCharacters = GameDataManager.getCharacters();
      const newCharacter = canonicalCharacters[characterId];
      if (newCharacter && newCharacter.id !== character.id) {
        setCharacter(newCharacter);
      }
    } catch (error) {
      console.error('Error updating character from URL:', error);
    }
  }, [pathname, character.id, isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    setCharacter(props.character);

    GameDataManager.invalidate({ characters: true, factions: true });
    const canonicalCharacters = GameDataManager.getCharacters();

    for (const [id, value] of Object.entries(canonicalCharacters)) {
      const existing = characters[id];
      if (existing) {
        Object.assign(existing, value);
      } else {
        characters[id] = proxy(value);
      }
    }

    for (const id of Object.keys(characters)) {
      if (!canonicalCharacters[id]) {
        delete characters[id];
      }
    }
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
