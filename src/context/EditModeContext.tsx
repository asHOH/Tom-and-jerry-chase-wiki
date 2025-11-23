'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { characters, factions } from '@/data';
import { proxy, subscribe } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';

interface EditModeContextType {
  isEditMode: boolean;
  isLoading: boolean; // New loading state
  toggleEditMode: () => void;
}

export const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEditMode = localStorage.getItem('isEditMode');
      setIsEditMode(storedEditMode ? JSON.parse(storedEditMode) : false);
      setHasInitialized(true);
    }
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true); // New loading state

  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      localStorage.setItem('isEditMode', JSON.stringify(isEditMode));
      try {
        window.dispatchEvent(new CustomEvent('editmode:changed', { detail: { isEditMode } }));
      } catch {}
    }
  }, [isEditMode, hasInitialized]);

  useEffect(() => {
    if (isEditMode && hasInitialized) {
      setIsLoading(false); // Set loading to false after data is loaded
      if (typeof localStorage !== 'undefined') {
        Object.assign(characters, JSON.parse(localStorage.getItem('characters') ?? '{}'));
        Object.assign(factions, JSON.parse(localStorage.getItem('factions') ?? '{}'));
      }
    }
    const unsubChars = subscribe(characters, () => {
      try {
        localStorage.setItem('characters', JSON.stringify(characters));
      } catch {}
    });
    const unsubFactions = subscribe(factions, () => {
      try {
        localStorage.setItem('factions', JSON.stringify(factions));
      } catch {}
    });
    return () => {
      unsubChars();
      unsubFactions();
    };
  }, [isEditMode, hasInitialized]);

  const toggleEditMode = () => {
    setIsEditMode((prevMode) => !prevMode);
    if (isEditMode) {
      localStorage.removeItem('characters');
      localStorage.removeItem('factions');
      const originalCharacters = GameDataManager.getCharacters();
      const originalFactions = GameDataManager.getFactions();
      for (const [key, value] of Object.entries(originalCharacters)) {
        // Keep nested entries as proxies to support useSnapshot on sub-objects
        characters[key] = proxy(value);
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
      // Restore caches to canonical data
      GameDataManager.invalidate();
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
