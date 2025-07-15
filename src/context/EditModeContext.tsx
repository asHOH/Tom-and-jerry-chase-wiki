'use client';

import { characters, factions } from '@/data';
import { GameDataManager } from '@/lib/dataManager';
import { usePathname } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  isLoading: boolean; // New loading state
  toggleEditMode: () => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedEditMode = localStorage.getItem('isEditMode');
      return storedEditMode ? JSON.parse(storedEditMode) : false;
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true); // New loading state

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isEditMode', JSON.stringify(isEditMode));
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      setIsLoading(false); // Set loading to false after data is loaded
      if (typeof localStorage !== 'undefined') {
        Object.assign(characters, JSON.parse(localStorage.getItem('characters') ?? '{}'));
        Object.assign(factions, JSON.parse(localStorage.getItem('factions') ?? '{}'));
      }
    }
  }, [isEditMode]);

  const toggleEditMode = () => {
    setIsEditMode((prevMode) => !prevMode);
    if (isEditMode) {
      localStorage.removeItem('characters');
      localStorage.removeItem('factions');
      const originalCharacters = GameDataManager.getCharacters();
      const originalFactions = GameDataManager.getFactions();
      for (const [key, value] of Object.entries(originalCharacters)) {
        characters[key] = value;
      }
      for (const key of Object.keys(characters)) {
        if (!originalCharacters[key]) {
          delete characters[key];
        }
      }
      for (const [key, value] of Object.entries(originalFactions)) {
        factions[key] = value;
      }
      for (const key of Object.keys(factions)) {
        if (!originalFactions[key]) {
          delete factions[key];
        }
      }
    }
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, isLoading, toggleEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};

export const useLocalCharacter = () => {
  const path = usePathname();
  const pathParts = path.split('/');
  const characterId = decodeURIComponent(pathParts[pathParts.length - 2] || '');
  const context = { characterId };
  return context;
};
