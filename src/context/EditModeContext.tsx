'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  loadEntitiesFromStorage,
  setupEntitySubscribers,
  teardownSubscribers,
} from '@/lib/edit/editModeRegistry';
import { isEditModeSearchParamEnabled } from '@/hooks/useSearchParamEditMode';

type EditModeContextType = {
  /** Whether edit mode is active for the current page (from URL ?edit=1) */
  isEditMode: boolean;
  /** Loading state during initialization */
  isLoading: boolean;
};

export const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const previousEditModeRef = useRef<boolean>(false);

  // Edit mode is now determined by URL param
  const isEditMode = useMemo(() => {
    return isEditModeSearchParamEnabled(searchParams);
  }, [searchParams]);

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasInitialized(true);
    }
  }, []);

  // Set up entity syncing when edit mode is active
  useEffect(() => {
    if (!hasInitialized) return undefined;

    const wasEditMode = previousEditModeRef.current;
    previousEditModeRef.current = isEditMode;

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('isEditMode', JSON.stringify(isEditMode));
        if (isEditMode && !wasEditMode) {
          window.localStorage.setItem('editmode:enabledAt', String(Date.now()));
        }
      } catch (error) {
        console.error('Failed to persist edit mode state:', error);
      }

      window.dispatchEvent(new CustomEvent('editmode:changed', { detail: { isEditMode } }));
    }

    if (isEditMode && !wasEditMode) {
      // Entering edit mode - load from storage
      loadEntitiesFromStorage();
      setIsLoading(false);

      // Subscribe to all registered entities
      setupEntitySubscribers();

      return () => {
        teardownSubscribers();
      };
    } else if (!isEditMode && wasEditMode) {
      // Exiting edit mode - handled by page-level controls
      // Don't automatically clear here - let the page decide
      setIsLoading(false);
    } else if (isEditMode) {
      // Already in edit mode, just set up subscriptions
      setIsLoading(false);
      setupEntitySubscribers();

      return () => {
        teardownSubscribers();
      };
    }

    setIsLoading(false);
    return undefined;
  }, [isEditMode, hasInitialized]);

  const contextValue = useMemo(
    () => ({
      isEditMode,
      isLoading,
    }),
    [isEditMode, isLoading]
  );

  return <EditModeContext.Provider value={contextValue}>{children}</EditModeContext.Provider>;
};

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};
