'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { EditModeProvider } from './EditModeContext';

interface AppContextType {
  isDetailedView: boolean;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string, fromCharacterId?: string) => void;
  toggleDetailedView: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [isDetailedView, setIsDetailedView] = useState<boolean>(false);

  const handleSelectCharacter = (characterId: string) => {
    router.push(`/characters/${encodeURIComponent(characterId)}`);
  };

  const handleSelectCard = (cardId: string, fromCharacterId?: string) => {
    const url = `/cards/${encodeURIComponent(cardId)}`;
    if (fromCharacterId) {
      router.push(`${url}?from=${encodeURIComponent(fromCharacterId)}`);
    } else {
      router.push(url);
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
