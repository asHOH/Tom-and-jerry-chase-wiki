import { loadFactionsAndCharacters, saveFactionsAndCharacters } from '@/lib/editUtils';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

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
      localStorage.removeItem('editableFields');
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

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};
