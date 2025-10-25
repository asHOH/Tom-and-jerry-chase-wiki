'use client';

import { EditModeProvider } from './EditModeContext';
import { isOriginalCharacter } from '@/lib/editUtils';
import { useNavigation } from '@/lib/useNavigation';
import { proxy, useSnapshot } from 'valtio';

interface AppContextType {
  isDetailedView: boolean;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string, fromCharacterId?: string) => void;
  toggleDetailedView: () => void;
}

const isDetailedViewStore = proxy({ isDetailedView: false });

if (typeof localStorage !== 'undefined') {
  const isDetailedViewStored: boolean = JSON.parse(
    localStorage.getItem('isDetailedView') ?? 'false'
  );
  isDetailedViewStore.isDetailedView = isDetailedViewStored;
}

export const AppProvider = EditModeProvider;

export const useAppContext = () => {
  const { navigate } = useNavigation();
  const { isDetailedView } = useSnapshot(isDetailedViewStore);

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
    localStorage.setItem('isDetailedView', JSON.stringify(!originalIsDetailedView));
  };

  return {
    isDetailedView,
    toggleDetailedView,
    handleSelectCard,
    handleSelectCharacter,
  } satisfies AppContextType;
};
