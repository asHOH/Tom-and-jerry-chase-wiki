import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { characters } from '@/data';
import { catCharactersWithImages } from '@/features/characters/data/catCharacters';
import { mouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';

export const useCharacterNavigation = (currentCharacterId: string) => {
  const router = useRouter();

  // Get all character IDs in the same order as displayed in character grid
  // (mice first in their original order, then cats in their original order)
  const characterIds = useMemo(() => {
    const mouseIds = Object.keys(mouseCharactersWithImages);
    const catIds = Object.keys(catCharactersWithImages);
    return [...mouseIds, ...catIds];
  }, []);

  // Get current character index
  const currentIndex = useMemo(() => {
    return characterIds.indexOf(currentCharacterId);
  }, [characterIds, currentCharacterId]);

  // Get previous character
  const previousCharacter = useMemo(() => {
    if (currentIndex <= 0) return null;
    const prevId = characterIds[currentIndex - 1];
    if (!prevId) return null;
    return {
      id: prevId,
      character: characters[prevId],
    };
  }, [characterIds, currentIndex]);

  // Get next character
  const nextCharacter = useMemo(() => {
    if (currentIndex >= characterIds.length - 1) return null;
    const nextId = characterIds[currentIndex + 1];
    if (!nextId) return null;
    return {
      id: nextId,
      character: characters[nextId],
    };
  }, [characterIds, currentIndex]);

  // Navigation functions
  const navigateToPrevious = useCallback(() => {
    if (previousCharacter?.id) {
      router.push(`/characters/${encodeURIComponent(previousCharacter.id)}`);
    }
  }, [previousCharacter, router]);

  const navigateToNext = useCallback(() => {
    if (nextCharacter?.id) {
      router.push(`/characters/${encodeURIComponent(nextCharacter.id)}`);
    }
  }, [nextCharacter, router]);

  return {
    previousCharacter,
    nextCharacter,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    totalCharacters: characterIds.length,
  };
};
