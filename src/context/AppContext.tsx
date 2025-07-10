'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EditModeProvider } from './EditModeContext';
import { isOriginalCharacter } from '@/lib/editUtils';
import { useNavigation } from '@/lib/useNavigation';

interface AppContextType {
  isDetailedView: boolean;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string, fromCharacterId?: string) => void;
  toggleDetailedView: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { navigate } = useNavigation();
  const [isDetailedView, setIsDetailedView] = useState<boolean>(false);

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
    setIsDetailedView(!isDetailedView);
  };

  return (
    <EditModeProvider>
      <AppContext.Provider
        value={{
          isDetailedView,
          handleSelectCharacter,
          handleSelectCard,
          toggleDetailedView,
        }}
      >
        {children}
      </AppContext.Provider>
    </EditModeProvider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
