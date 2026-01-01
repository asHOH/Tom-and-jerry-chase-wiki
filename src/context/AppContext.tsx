'use client';

import { startTransition, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { proxy, useSnapshot } from 'valtio';

import { isOriginalCharacter } from '@/lib/editUtils';
import { useNavigation } from '@/hooks/useNavigation';

interface AppContextType {
  isDetailedView: boolean;
  handleSelectCharacter: (characterId: string) => void;
  handleSelectCard: (cardId: string, fromCharacterId?: string) => void;
  toggleDetailedView: () => void;
}

const isDetailedViewStore = proxy({ isDetailedView: false });

export const useAppContext = () => {
  const { navigate } = useNavigation();
  const [storedDetailedView, setStoredDetailedView] = useLocalStorage<boolean>(
    'isDetailedView',
    false
  );
  const { isDetailedView } = useSnapshot(isDetailedViewStore);

  useEffect(() => {
    isDetailedViewStore.isDetailedView = storedDetailedView ?? false;
  }, [storedDetailedView]);

  const handleSelectCharacter = (characterId: string) => {
    const isOriginal = isOriginalCharacter(characterId);
    const targetPath = isOriginal
      ? `/characters/${encodeURIComponent(characterId)}`
      : `/characters/user/${encodeURIComponent(characterId)}`;
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
    // Immediate local update for responsive UI
    isDetailedViewStore.isDetailedView = next;

    // Defer storage persistence and downstream re-renders
    startTransition(() => {
      setStoredDetailedView(() => {
        queueMicrotask(() => {
          try {
            localStorage.setItem('isDetailedView', JSON.stringify(next));
          } catch {
            // Ignore storage failures to avoid disrupting UI toggle
          }
        });
        return next;
      });
    });
  };

  return {
    isDetailedView,
    toggleDetailedView,
    handleSelectCard,
    handleSelectCharacter,
  } satisfies AppContextType;
};
