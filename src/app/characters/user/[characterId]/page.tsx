'use client';

import React, { useEffect, useState } from 'react';
import { notFound, usePathname } from 'next/navigation';
import { characters } from '@/data';
import CharacterDetailsClient from '@/app/characters/[characterId]/CharacterDetailsClient';
import NavigationWrapper from '@/components/NavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { CharacterWithFaction } from '@/lib/types';

// This is a fully client-rendered page for user-created or renamed characters

export default function UserCharacterPage() {
  const pathname = usePathname();
  const [character, setCharacter] = useState<CharacterWithFaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract characterId from the URL, e.g., '/characters/user/MyNewCat' -> 'MyNewCat'
    const characterId = decodeURIComponent(pathname.split('/').pop() || '');

    // Data is loaded from the global characters object, which is populated from localStorage in edit mode
    const charData = characters[characterId];

    if (charData) {
      setCharacter(charData);
    } else {
      // If no character data is found on the client, it's a true 404
      setCharacter(null);
    }
    setIsLoading(false);
  }, [pathname]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!character) {
    notFound();
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <NavigationWrapper showDetailToggle={true}>
          <CharacterDetailsClient character={character} />
        </NavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
