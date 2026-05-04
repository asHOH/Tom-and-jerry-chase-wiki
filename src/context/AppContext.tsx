'use client';

import { useLayoutEffect } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { isOriginalCharacter } from '@/lib/editUtils';
import { useNavigation } from '@/hooks/useNavigation';

type AppContextType = {
  isDetailedView: boolean;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string, fromCharacterId?: string) => void;
  toggleDetailedView: () => void;
};

const isDetailedViewStore = proxy({ isDetailedView: false });
const DETAILED_VIEW_STORAGE_KEY = 'isDetailedView';

let hasHydratedDetailedView = false;
let hasRegisteredDetailedViewStorageListener = false;

const readStoredDetailedView = () => {
  if (typeof window === 'undefined') return false;

  try {
    const storedValue = window.localStorage.getItem(DETAILED_VIEW_STORAGE_KEY);
    if (!storedValue) return false;
    return JSON.parse(storedValue) === true;
  } catch (error) {
    console.warn('Unable to read detailed-view preference from localStorage:', error);
    return false;
  }
};

const persistDetailedView = (isDetailedView: boolean) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(DETAILED_VIEW_STORAGE_KEY, JSON.stringify(isDetailedView));
  } catch (error) {
    console.warn('Unable to persist detailed-view preference to localStorage:', error);
  }
};

const hydrateDetailedViewStore = () => {
  if (typeof window === 'undefined') return;

  if (!hasHydratedDetailedView) {
    isDetailedViewStore.isDetailedView = readStoredDetailedView();
    hasHydratedDetailedView = true;
  }

  if (hasRegisteredDetailedViewStorageListener) return;

  window.addEventListener('storage', (event) => {
    if (event.key !== DETAILED_VIEW_STORAGE_KEY) return;
    isDetailedViewStore.isDetailedView = readStoredDetailedView();
  });
  hasRegisteredDetailedViewStorageListener = true;
};

export const useAppContext = () => {
  const { navigate } = useNavigation();
  const { isDetailedView } = useSnapshot(isDetailedViewStore);

  useLayoutEffect(() => {
    hydrateDetailedViewStore();
  }, []);

  const handleSelectCharacter = (characterId: string) => {
    const isOriginal = isOriginalCharacter(characterId);
    const targetPath = isOriginal
      ? `/characters/${encodeURIComponent(characterId)}`
      : `/characters/user/${encodeURIComponent(characterId)}?edit=1`;
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
    const next = !isDetailedViewStore.isDetailedView;
    isDetailedViewStore.isDetailedView = next;
    persistDetailedView(next);
  };

  return {
    isDetailedView,
    toggleDetailedView,
    handleSelectCard,
    handleSelectCharacter,
  } satisfies AppContextType;
};
