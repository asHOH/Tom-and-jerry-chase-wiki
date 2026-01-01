'use client';

import { useEffect } from 'react';
import { proxy, useSnapshot } from 'valtio';
import { useLocalStorage } from 'usehooks-ts';

import { isOriginalCharacter } from '@/lib/editUtils';
import { useNavigation } from '@/hooks/useNavigation';

interface AppContextType {
  isDetailedView: boolean;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string, fromCharacterId?: string) => void;
  toggleDetailedView: () => void;
}

const isDetailedViewStore = proxy({ isDetailedView: false });

export const useAppContext = () => {
  const { navigate } = useNavigation();
  const [storedDetailedView, setStoredDetailedView] = useLocalStorage<boolean>(
    'isDetailedView',
    false
  );
  const { isDetailedView } = useSnapshot(isDetailedViewStore);

  useEffect(() => {
    isDetailedViewStore.isDetailedView = storedDetailedView ?? false;
  }, [storedDetailedView]);

  const handleSelectCharacter = (characterId: string) => {
    const isOriginal = isOriginalCharacter(characterId);
    const targetPath = isOriginal
      ? `/characters/${encodeURIComponent(characterId)}`
      : `/characters/user/${encodeURIComponent(characterId)}`;
    navigate(targetPath);
  };

  const handleSelectCard = (cardId: string, fromCharacterId?: string) => {
    const url = `/cards/${encodeURIComponent(cardId)}`;
    if (fromCharacterId) {
      navigate(`${url}?from=${encodeURIComponent(fromCharacterId)}`);
    } else {
      navigate(url);
    }
  };

  const toggleDetailedView = () => {
    setStoredDetailedView((prev) => {
      const next = !prev;
      isDetailedViewStore.isDetailedView = next; // immediate update for UI responsiveness
      return next;
    });
  };

  return {
    isDetailedView,
    toggleDetailedView,
    handleSelectCard,
    handleSelectCharacter,
  } satisfies AppContextType;
};
