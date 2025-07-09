'use client';

import { loadFactionsAndCharacters, saveFactionsAndCharacters } from '@/lib/editUtils';
import { CharacterWithFaction } from '@/lib/types';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  SetStateAction,
} from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
}

interface LocalCharacterContextType {
  localCharacter: CharacterWithFaction;
  setLocalCharacter: React.Dispatch<SetStateAction<CharacterWithFaction>>;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);
export const LocalCharacterContext = createContext<LocalCharacterContextType | undefined>(
  undefined
);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    // Initialize from localStorage, default to true
    if (typeof window !== 'undefined') {
      const storedEditMode = localStorage.getItem('isEditMode');
      return storedEditMode ? JSON.parse(storedEditMode) : false;
    }
    return false;
  });

  useEffect(() => {
    // Save to localStorage whenever isEditMode changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('isEditMode', JSON.stringify(isEditMode));
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      loadFactionsAndCharacters();
    }
  }, [isEditMode]);

  const toggleEditMode = () => {
    setIsEditMode((prevMode) => !prevMode);
    if (isEditMode) {
      localStorage.removeItem('characters');
      localStorage.removeItem('factions');
    } else {
      saveFactionsAndCharacters();
    }
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const LocalCharacterProvider = ({
  character,
  children,
}: {
  character: CharacterWithFaction;
  children: ReactNode;
}) => {
  const [localCharacter, setLocalCharacter] = useState<CharacterWithFaction>(character);

  useEffect(() => {
    // The character prop is now always the correct one, whether from static data or the user route.
    // This effect ensures the local state is updated if the user navigates between character pages.
    setLocalCharacter(character);
  }, [character]);

  return (
    <LocalCharacterContext.Provider value={{ localCharacter, setLocalCharacter }}>
      {children}
    </LocalCharacterContext.Provider>
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
  const context = useContext(LocalCharacterContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};
