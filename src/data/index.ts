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

export const { factionData, characterData, cardData } = GameDataManager.getRawData();

export const factions = GameDataManager.getFactions();
export const characters = GameDataManager.getCharacters();
export const factionCards = GameDataManager.getFactionCards();
export const cards = GameDataManager.getCards();
