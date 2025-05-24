'use client';

import { notFound } from 'next/navigation';
import { characters } from '@/data/mockData';
import CharacterDetails from '@/components/CharacterDetails';

// This page uses the CharacterDetails component to avoid code duplication
// The component handles both SPA navigation and direct URL access

export default function CharacterPage({ params }: { params: { characterId: string } }) {
  // Use the characters data from the mockData.ts file
  const character = characters[params.characterId];

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
