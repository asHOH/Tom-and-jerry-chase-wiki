'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  activeTab: string | null;
  selectedCharacter: string | null;
  selectedCard: string | null;
  isDetailedView: boolean;
  handleTabChange: (tabId: string) => void;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string) => void;
  toggleDetailedView: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isDetailedView, setIsDetailedView] = useState<boolean>(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId === '' ? null : tabId);
    setSelectedCharacter(null);
    setSelectedCard(null);
  };

  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacter(characterId);
    setSelectedCard(null);
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedCard(cardId);
    setSelectedCharacter(null);
  };

  const toggleDetailedView = () => {
    setIsDetailedView(!isDetailedView);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        selectedCharacter,
        selectedCard,
        isDetailedView,
        handleTabChange,
        handleSelectCharacter,
        handleSelectCard,
        toggleDetailedView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
