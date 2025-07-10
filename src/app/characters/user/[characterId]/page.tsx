'use client';

import React, { useEffect, useState } from 'react';
import { notFound, usePathname } from 'next/navigation';
import { characters } from '@/data';
import CharacterDetailsClient from '@/app/characters/[characterId]/CharacterDetailsClient';
import NavigationWrapper from '@/components/NavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { CharacterWithFaction } from '@/lib/types';

/**
 * This is the client component that contains the actual page logic.
 * It can safely use hooks that depend on the contexts provided by its parent.
 */
function UserCharacterPageClient() {
  const pathname = usePathname();
  const { isLoading } = useEditMode();
  const [character, setCharacter] = useState<CharacterWithFaction | null>(null);
  const [isCharacterLoading, setIsCharacterLoading] = useState(true);

  useEffect(() => {
    // Wait for the EditModeContext to finish loading the data from localStorage
    if (isLoading) return;
    const pathParts = pathname.split('/');
    const characterId = decodeURIComponent(
      decodeURIComponent(pathParts[pathParts.length - 2] || '')
    ); // very strange - it seems that the last part of the path is always empty due to trailing slashes, so we need to take the second last part
    const charData = characters[characterId];

    if (charData) {
      setCharacter(charData);
    } else {
      setCharacter(null);
    }
    setIsCharacterLoading(false);
  }, [pathname, isLoading]);

  // Show a loading state while the context or the character data is loading
  if (isLoading || isCharacterLoading) {
    return <div>Loading...</div>;
  }

  if (!character) {
    notFound();
  }

  return (
    <NavigationWrapper showDetailToggle={true}>
      <CharacterDetailsClient character={character} />
    </NavigationWrapper>
  );
}

/**
 * This is the main page component, responsible for setting up the context providers.
 */
export default function UserCharacterPage() {
  return (
    <AppProvider>
      <UserCharacterPageClient />
    </AppProvider>
  );
}
