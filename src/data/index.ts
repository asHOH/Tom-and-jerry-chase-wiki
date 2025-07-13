// Re-export types for backward compatibility
export type {
  FactionId,
  Faction,
  Character,
  Skill,
  SkillLevel,
  Card,
  CardLevel,
  CardRank,
  PositioningTag,
  PositioningTagName,
} from './types';

import { GameDataManager } from '@/lib/dataManager';
import { CharacterWithFaction, FactionWithCharacters } from '@/lib/types';
import { proxy, subscribe } from 'valtio';

export const { factionData, characterData, cardData } = GameDataManager.getRawData();

const localCharacters =
  typeof localStorage != 'undefined' ? localStorage.getItem('characters') : null;

export const characters: Record<string, CharacterWithFaction> = proxy(
  localCharacters ? JSON.parse(localCharacters) : GameDataManager.getCharacters()
);

const localFactions = typeof localStorage != 'undefined' ? localStorage.getItem('factions') : null;

export const factions: Record<string, FactionWithCharacters> = proxy(
  localFactions ? JSON.parse(localFactions) : GameDataManager.getFactions()
);

subscribe(characters, () => {
  localStorage.setItem('characters', JSON.stringify(characters));
});

subscribe(factions, () => {
  localStorage.setItem('factions', JSON.stringify(factions));
});

export const factionCards = GameDataManager.getFactionCards();
export const cards = GameDataManager.getCards();
