import { proxy } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import { CharacterWithFaction, FactionWithCharacters, KnowledgeCardWithFaction } from '@/lib/types';

export const characters: Record<string, CharacterWithFaction> = proxy(
  GameDataManager.getCharacters()
);

export const factions: Record<string, FactionWithCharacters> = proxy(GameDataManager.getFactions());

// Knowledge cards are exported as a read-only static object in src/data/static.ts.
// This proxy-backed store enables local-only edit mode, mirroring how characters are edited.
export const cardsEdit: Record<string, KnowledgeCardWithFaction> = proxy(
  GameDataManager.getCards()
);
