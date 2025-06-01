'use client';

import { notFound } from 'next/navigation';
import { characters } from '@/data';
import CharacterDetails from '@/components/displays/characters/CharacterDetails';
import { use } from 'react';

// This page uses the CharacterDetails component to avoid code duplication
// The component handles both SPA navigation and direct URL access

export default function CharacterPage({ params }: { params: Promise<{ characterId: string }> }) {
  // Use the characters data from the data files
  const resolvedParams = use(params);
  const character = characters[resolvedParams.characterId];

  if (!character) {
    notFound();
  }

  // Use the CharacterDetails component without the detailed view toggle
  // (the toggle is only shown in SPA mode when propIsDetailedView is undefined)
  return (
    <CharacterDetails
      character={character}
      isDetailedView={false} // Static page shows simple view by default
    />
  );
}
