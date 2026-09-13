import { useEffect } from 'react';

import { shouldIgnorePageNavigationKey } from '@/lib/keyboardNavigation';
import { useEditMode } from '@/context/EditModeContext';
import type { FactionId } from '@/data/types';

import { useSpecifyTypeNavigation, type NavigationEntityType } from './useSpecifyTypeNavigation';

/**
 * Navigation for knowledgeCards,specialSkills,items,entities
 * @param currentId - string - name of target to be searched
 * @param specifyType - 'knowledgeCard' | 'specialSkill' | 'item' | 'entity' | 'buff' -type of target to be searched
 * @param factionId - Identifies the current special skill or achievement within its faction.
 */
export const useSpecifyTypeKeyboardNavigation = (
  currentId: string,
  specifyType: NavigationEntityType,
  factionId?: FactionId
) => {
  const { isEditMode } = useEditMode();
  const { navigateToPrevious, navigateToNext, previousTarget, nextTarget } =
    useSpecifyTypeNavigation(currentId, specifyType, factionId);

  useEffect(() => {
    if (isEditMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (shouldIgnorePageNavigationKey(e)) return;

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
  }, [isEditMode, navigateToPrevious, navigateToNext, previousTarget, nextTarget]);
};
