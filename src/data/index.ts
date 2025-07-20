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
import catSpecialSkillsWithImages from './catSpecialSkills';
import mouseSpecialSkillsWithImages from './mouseSpecialSkills';

export const { factionData, characterData, cardData } = GameDataManager.getRawData();

export const characters: Record<string, CharacterWithFaction> = proxy(
  GameDataManager.getCharacters()
);

export const factions: Record<string, FactionWithCharacters> = proxy(GameDataManager.getFactions());

subscribe(characters, () => {
  localStorage.setItem('characters', JSON.stringify(characters));
});

subscribe(factions, () => {
  localStorage.setItem('factions', JSON.stringify(factions));
});

export const cards = GameDataManager.getCards();

export const specialSkills = {
  cat: catSpecialSkillsWithImages,
  mouse: mouseSpecialSkillsWithImages,
};
