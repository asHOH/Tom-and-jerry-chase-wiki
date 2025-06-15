import React from 'react';
import { notFound } from 'next/navigation';
import { characters } from '@/data';
import CharacterDetailsClient from '@/app/characters/[characterId]/CharacterDetailsClient';

// Generate static params for all characters
export function generateStaticParams() {
  return Object.keys(characters).map((characterId) => ({
    characterId: encodeURIComponent(characterId),
  }));
}

// This page uses the CharacterDetails component to avoid code duplication
// The component handles both SPA navigation and direct URL access

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  // Use the characters data from the data files
  const resolvedParams = await params;
  const decodedCharacterId = decodeURIComponent(resolvedParams.characterId);
  const character = characters[decodedCharacterId];

  if (!character) {
    notFound();
  }

  // Use the CharacterDetails component without the detailed view toggle
  // (the toggle is only shown in SPA mode when propIsDetailedView is undefined)
  return (
    <CharacterDetailsClient
      character={character}
      isDetailedView={false} // Static page shows simple view by default
    />
  );
}
