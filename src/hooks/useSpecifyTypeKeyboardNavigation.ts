import { useEditMode } from '@/context/EditModeContext';
import type { FactionId } from '@/data/types';

import { usePageNavigationKeys } from './usePageNavigationKeys';
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

  usePageNavigationKeys(
    previousTarget ? navigateToPrevious : undefined,
    nextTarget ? navigateToNext : undefined,
    isEditMode
  );
};
