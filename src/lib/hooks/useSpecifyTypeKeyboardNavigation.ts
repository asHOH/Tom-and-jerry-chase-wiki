import { useEffect } from 'react';
import { useSpecifyTypeNavigation } from './useSpecifyTypeNavigation';

//The KeyboardNavigation for knowledgeCards,specialSkills,items,entities

type typelist = 'item' | 'entity';
export const useSpecifyTypeKeyboardNavigation = (currentId: string, specifyType: typelist) => {
  const { navigateToPrevious, navigateToNext, previousTarget, nextTarget } =
    useSpecifyTypeNavigation(currentId, specifyType);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (previousTarget) {
            navigateToPrevious();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (nextTarget) {
            navigateToNext();
          }
          break;
        case 'h': // Vim-style navigation
          e.preventDefault();
          if (previousTarget) {
            navigateToPrevious();
          }
          break;
        case 'l': // Vim-style navigation
          e.preventDefault();
          if (nextTarget) {
            navigateToNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigateToPrevious, navigateToNext, previousTarget, nextTarget]);
};
