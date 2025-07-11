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
import { CharacterWithFaction } from '@/lib/types';
import { proxy, snapshot, subscribe } from 'valtio';

export const { factionData, characterData, cardData } = GameDataManager.getRawData();

export const factions = GameDataManager.getFactions();

const localCharacters =
  typeof localStorage != 'undefined' ? localStorage.getItem('characters') : null;

export const characters: Record<string, CharacterWithFaction> = proxy(
  localCharacters ? JSON.parse(localCharacters) : GameDataManager.getCharacters()
);

subscribe(characters, () => {
  localStorage.setItem('characters', JSON.stringify(characters));
  console.log(snapshot(characters));
});

export const factionCards = GameDataManager.getFactionCards();
export const cards = GameDataManager.getCards();
