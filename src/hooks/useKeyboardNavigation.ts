import { useEffect } from 'react';

import { shouldIgnorePageNavigationKey } from '@/lib/keyboardNavigation';
import { useCharacterNavigation } from '@/features/characters/hooks/useCharacterNavigation';

export const useKeyboardNavigation = (currentCharacterId: string, disabled = false) => {
  const { navigateToPrevious, navigateToNext, previousId, nextId } =
    useCharacterNavigation(currentCharacterId);

  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (shouldIgnorePageNavigationKey(e)) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (previousId) {
            navigateToPrevious();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (nextId) {
            navigateToNext();
          }
          break;
        case 'h': // Vim-style navigation
          e.preventDefault();
          if (previousId) {
            navigateToPrevious();
          }
          break;
        case 'l': // Vim-style navigation
          e.preventDefault();
          if (nextId) {
            navigateToNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, navigateToPrevious, navigateToNext, previousId, nextId]);
};
