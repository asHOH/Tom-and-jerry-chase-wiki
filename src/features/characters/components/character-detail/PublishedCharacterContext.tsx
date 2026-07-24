'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { CharacterWithFaction } from '@/lib/types';
import { characters } from '@/data/static';

const PublishedCharacterContext = createContext<DeepReadonly<CharacterWithFaction> | null>(null);

export function PublishedCharacterProvider({
  character,
  children,
}: {
  character: DeepReadonly<CharacterWithFaction>;
  children: ReactNode;
}) {
  return (
    <PublishedCharacterContext.Provider value={character}>
      {children}
    </PublishedCharacterContext.Provider>
  );
}

export function usePublishedCharacter(characterId: string): DeepReadonly<CharacterWithFaction> {
  const character = useContext(PublishedCharacterContext);
  return character?.id === characterId ? character : characters[characterId]!;
}
