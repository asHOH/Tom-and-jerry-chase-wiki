'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { CharacterWithFaction } from '@/lib/types';
import { characters } from '@/data/static';

const PublishedCharacterContext = createContext<{
  sourceId: string;
  character: DeepReadonly<CharacterWithFaction>;
} | null>(null);

export function PublishedCharacterProvider({
  character,
  sourceId = character.id,
  children,
}: {
  character: DeepReadonly<CharacterWithFaction>;
  sourceId?: string;
  children: ReactNode;
}) {
  return (
    <PublishedCharacterContext.Provider value={{ sourceId, character }}>
      {children}
    </PublishedCharacterContext.Provider>
  );
}

export function usePublishedCharacter(characterId: string): DeepReadonly<CharacterWithFaction> {
  const published = useContext(PublishedCharacterContext);
  return published &&
    (published.sourceId === characterId.trim() || published.character.id === characterId)
    ? published.character
    : characters[characterId]!;
}
