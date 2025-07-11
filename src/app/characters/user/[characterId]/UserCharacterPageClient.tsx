'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { characters } from '@/data';
import CharacterDetailsClient from '@/app/characters/[characterId]/CharacterDetailsClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { useEditMode } from '@/context/EditModeContext';
import { CharacterWithFaction } from '@/lib/types';

/**
 * This is the client component that contains the actual page logic.
 * It can safely use hooks that depend on the contexts provided by its parent.
 */
export default function UserCharacterPageClient() {
  const pathname = usePathname();
  const { isLoading } = useEditMode();
  const [character, setCharacter] = useState<CharacterWithFaction | null>(null);
  const [isCharacterLoading, setIsCharacterLoading] = useState(true);

  useEffect(() => {
    const pathParts = pathname?.split('/') || [];
    const characterId = pathParts[pathParts.length - 2]; // Get characterId from path

    if (characterId) {
      const decodedCharacterId = decodeURIComponent(characterId);
      // characters is an object with character names as keys
      const foundCharacter = characters[decodedCharacterId];
      setCharacter(foundCharacter || null);
    }
    setIsCharacterLoading(false);
  }, [pathname]);

  if (isLoading || isCharacterLoading) {
    return <div className='dark:text-white'>加载中...</div>;
  }

  // FIXME: i want to move the logic to another file
  // if (!character) {
  //   notFound();
  // }

  return (
    <TabNavigationWrapper showDetailToggle={true}>
      <CharacterDetailsClient character={character!} />
    </TabNavigationWrapper>
  );
}
