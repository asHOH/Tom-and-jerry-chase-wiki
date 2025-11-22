'use client';

import CharacterDetailsClient from '@/app/(main)/characters/[characterId]/CharacterDetailsClient';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { characters } from '@/data';
import { CharacterWithFaction } from '@/lib/types';
import { useEffect, useState } from 'react';

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
    return <div className='dark:text-white'>加载中...</div>;
  }

  // FIXME: i want to move the logic to another file
  // if (!character) {
  //   notFound();
  // }

  return <CharacterDetailsClient character={character!} />;
}
