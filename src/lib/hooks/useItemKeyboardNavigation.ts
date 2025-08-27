import { useEffect } from 'react';
import { useEntityNavigation } from './useEntityNavigation';

export const useEntityKeyboardNavigation = (currentEntityId: string, disabled = false) => {
  const { navigateToPrevious, navigateToNext, previousEntity, nextEntity } =
    useEntityNavigation(currentEntityId);

  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (previousEntity) {
            navigateToPrevious();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (nextEntity) {
            navigateToNext();
          }
          break;
        case 'h': // Vim-style navigation
          e.preventDefault();
          if (previousEntity) {
            navigateToPrevious();
          }
          break;
        case 'l': // Vim-style navigation
          e.preventDefault();
          if (nextEntity) {
            navigateToNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, navigateToPrevious, navigateToNext, previousEntity, nextEntity]);
};
