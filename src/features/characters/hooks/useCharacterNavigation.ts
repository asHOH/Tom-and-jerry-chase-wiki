import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { getCharacterNavigationInfo } from '@/features/characters/data/characterMetadata';

export const useCharacterNavigation = (currentCharacterId: string) => {
  const router = useRouter();

  const { previousId, nextId, currentIndex, totalCharacters } = useMemo(() => {
    return getCharacterNavigationInfo(currentCharacterId);
  }, [currentCharacterId]);

  const navigateToPrevious = useCallback(() => {
    if (previousId) {
      router.push(`/characters/${encodeURIComponent(previousId)}`);
    }
  }, [previousId, router]);

  const navigateToNext = useCallback(() => {
    if (nextId) {
      router.push(`/characters/${encodeURIComponent(nextId)}`);
    }
  }, [nextId, router]);

  return {
    previousId,
    nextId,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    totalCharacters,
  };
};
