'use client';

import { useEffect, useState } from 'react';

import { CharacterWithFaction } from '@/lib/types';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { PageLoadingState } from '@/components/ui/LoadingState';
import CharacterDetailsClient from '@/app/(main)/characters/[characterId]/CharacterDetailsClient';
import { characters } from '@/data';

/**
 * This is the client component that contains the actual page logic.
 * It can safely use hooks that depend on the contexts provided by its parent.
 */
export default function UserCharacterPageClient() {
  const { isLoading, isEditMode } = useEditMode();
  const [character, setCharacter] = useState<CharacterWithFaction | null>(null);
  const [isCharacterLoading, setIsCharacterLoading] = useState(true);
  const { characterId } = useLocalCharacter();

  useEffect(() => {
    if (isEditMode && !isLoading) {
      const foundCharacter = characters[characterId];
      if (foundCharacter) {
        setCharacter(foundCharacter);
        setIsCharacterLoading(false);
      }
    }
  }, [characterId, isEditMode, isLoading]);

  if (isLoading || isCharacterLoading) {
    return <PageLoadingState type='character-detail' message='加载角色详情中...' />;
  }

  // FIXME: i want to move the logic to another file
  // if (!character) {
  //   notFound();
  // }

  return <CharacterDetailsClient character={character!} />;
}
