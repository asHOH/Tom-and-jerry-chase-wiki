import { useEffect } from 'react';
import { useSpecifyTypeNavigation } from './useSpecifyTypeNavigation';

type typelist = 'knowledgeCard' | 'specialSkill' | 'item' | 'entity';

/**
 * Navigation for knowledgeCards,specialSkills,items,entities
 * @param currentId - string - name of target to be searched
 * @param specifyType - 'knowledgeCard' | 'specialSkill' | 'item' | 'entity' -type of target to be searched
 * @param under - boolean(default false) - revease search to avoid same name(such as 应急治疗)
 */
export const useSpecifyTypeKeyboardNavigation = (
  currentId: string,
  specifyType: typelist,
  under: boolean = false
) => {
  const { navigateToPrevious, navigateToNext, previousTarget, nextTarget } =
    useSpecifyTypeNavigation(currentId, specifyType, under);

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
