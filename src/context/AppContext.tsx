'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { proxy, subscribe } from 'valtio';

import { isOriginalCharacter } from '@/lib/editUtils';
import { storage, StorageKey } from '@/lib/localStorage';
import { useNavigation } from '@/hooks/useNavigation';

type AppContextType = {
  isDetailedView: boolean;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string, fromCharacterId?: string) => void;
  toggleDetailedView: () => void;
};

const isDetailedViewStore = proxy({ isDetailedView: false });
let hasHydratedDetailedView = false;
let hasRegisteredDetailedViewStorageListener = false;

const subscribeDetailedView = (onStoreChange: () => void) =>
  subscribe(isDetailedViewStore, onStoreChange, true);

const getDetailedViewSnapshot = () => isDetailedViewStore.isDetailedView;

const getServerDetailedViewSnapshot = () => false;

const readStoredDetailedView = () => {
  return storage.getJson<boolean>(StorageKey.DetailedView) === true;
};

const persistDetailedView = (isDetailedView: boolean) => {
  if (!storage.setJson(StorageKey.DetailedView, isDetailedView)) {
    console.warn('Unable to persist detailed-view preference to localStorage.');
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
    if (event.key !== StorageKey.DetailedView) return;
    isDetailedViewStore.isDetailedView = readStoredDetailedView();
  });
  hasRegisteredDetailedViewStorageListener = true;
};

export const useAppContext = () => {
  const { navigate } = useNavigation();
  const isDetailedView = useSyncExternalStore(
    subscribeDetailedView,
    getDetailedViewSnapshot,
    getServerDetailedViewSnapshot
  );

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
