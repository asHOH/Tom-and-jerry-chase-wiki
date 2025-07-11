'use client';

import { characters } from '@/data';
import { loadFactionsAndCharacters, saveFactionsAndCharacters } from '@/lib/editUtils';
import { CharacterWithFaction } from '@/lib/types';
import type { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { usePathname } from 'next/navigation';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  SetStateAction,
} from 'react';
import { useSnapshot } from 'valtio';

interface EditModeContextType {
  isEditMode: boolean;
  isLoading: boolean; // New loading state
  toggleEditMode: () => void;
}

interface LocalCharacterContextType {
  localCharacter: DeepReadonly<CharacterWithFaction>;
  setLocalCharacter: React.Dispatch<SetStateAction<CharacterWithFaction>>;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);
export const LocalCharacterContext = createContext<LocalCharacterContextType | undefined>(
  undefined
);

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
      loadFactionsAndCharacters();
      setIsLoading(false); // Set loading to false after data is loaded
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
    <EditModeContext.Provider value={{ isEditMode, isLoading, toggleEditMode }}>
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
  const path = usePathname();
  const pathParts = path?.split('/') || [];
  const characterId = pathParts[pathParts.length - 2]; // Get characterId from path

  const foundCharacter = React.useMemo(() => {
    if (characterId) {
      const decodedCharacterId = decodeURIComponent(characterId);
      return characters[decodedCharacterId]!;
    }
    return character;
  }, [characterId, character]);

  const localCharacter = useSnapshot(foundCharacter);

  return (
    <LocalCharacterContext.Provider value={{ localCharacter, setLocalCharacter: () => {} }}>
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

/**
 * @deprecated directly use characters from the data module instead.
 * do NOT change this unless the user has explicitly requested to change the function and has confirmed that it will not break the app.
 */
export const useLocalCharacter = () => {
  const context = useContext(LocalCharacterContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};
