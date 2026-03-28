import { useEffect } from 'react';

import { useCharacterNavigation } from '@/features/characters/hooks/useCharacterNavigation';

export const useKeyboardNavigation = (currentCharacterId: string, disabled = false) => {
  const { navigateToPrevious, navigateToNext, previousId, nextId } =
    useCharacterNavigation(currentCharacterId);

  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger navigation if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

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
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            if (previousId) {
              navigateToPrevious();
            }
          }
          break;
        case 'l': // Vim-style navigation
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            if (nextId) {
              navigateToNext();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, navigateToPrevious, navigateToNext, previousId, nextId]);
};
