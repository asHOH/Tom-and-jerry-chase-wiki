'use client';

import { isOriginalCharacter } from '@/lib/editUtils';
import { useNavigation } from '@/hooks/useNavigation';
import { proxy, useSnapshot } from 'valtio';
import { useEffect } from 'react';

interface AppContextType {
  isDetailedView: boolean;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string, fromCharacterId?: string) => void;
  toggleDetailedView: () => void;
}

const isDetailedViewStore = proxy({ isDetailedView: false });

let detailedViewInitialized = false;

export const useAppContext = () => {
  const { navigate } = useNavigation();
  const { isDetailedView } = useSnapshot(isDetailedViewStore);

  useEffect(() => {
    if (detailedViewInitialized || typeof window === 'undefined') {
      return;
    }
    try {
      const stored = localStorage.getItem('isDetailedView');
      if (stored !== null) {
        isDetailedViewStore.isDetailedView = JSON.parse(stored);
      }
    } catch {
      // Ignore JSON parse/storage failures; default stays false for hydration stability.
    } finally {
      detailedViewInitialized = true;
    }
  }, []);

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
    const originalIsDetailedView = isDetailedViewStore.isDetailedView;
    isDetailedViewStore.isDetailedView = !originalIsDetailedView;
    try {
      localStorage.setItem('isDetailedView', JSON.stringify(!originalIsDetailedView));
    } catch {
      // Ignore storage failures to avoid disrupting UI toggle.
    }
  };

  return {
    isDetailedView,
    toggleDetailedView,
    handleSelectCard,
    handleSelectCharacter,
  } satisfies AppContextType;
};
