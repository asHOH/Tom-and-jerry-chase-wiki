import { useCharacterNavigation } from '@/features/characters/hooks/useCharacterNavigation';

import { usePageNavigationKeys } from './usePageNavigationKeys';

export const useKeyboardNavigation = (currentCharacterId: string, disabled = false) => {
  const { navigateToPrevious, navigateToNext, previousId, nextId } =
    useCharacterNavigation(currentCharacterId);

  usePageNavigationKeys(
    previousId ? navigateToPrevious : undefined,
    nextId ? navigateToNext : undefined,
    disabled
  );
};
