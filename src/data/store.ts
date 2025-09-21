import { GameDataManager } from '@/lib/dataManager';
import { CharacterWithFaction, FactionWithCharacters } from '@/lib/types';
import { proxy } from 'valtio';

export const characters: Record<string, CharacterWithFaction> = proxy(
  GameDataManager.getCharacters()
);

export const factions: Record<string, FactionWithCharacters> = proxy(GameDataManager.getFactions());
