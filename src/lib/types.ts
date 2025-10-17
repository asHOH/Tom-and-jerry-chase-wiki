/**
 * Centralized type definitions for component props and extended types
 * Eliminates duplication of type definitions across components
 */

import { Character, Card, PositioningTag, PositioningTagName, FactionId } from '@/data';
import { ReactNode } from 'react';

// Extended types with faction information (used in components)
export type CharacterWithFaction = Character & {
  imageUrl: string; // Required in components
  createDate: string | null; // Date when the character was added to the game (e.g., "2020.7.24")
};

export type KnowledgeCardWithFaction = Card & {
  imageUrl: string; // Required in components
  createDate: string | null; // Date when the character was added to the game (e.g., "2020.7.24")
};

// Component prop types
export type KnowledgeCardDisplayProps = {
  id: string;
  name: string;
  rank: string;
  cost: number;
  imageUrl: string;
  onClick: (cardId: string) => void;
};

export type CharacterDisplayProps = {
  id: string;
  name: string;
  imageUrl: string;
  positioningTags: PositioningTag[];
  factionId: string;
};

export type KnowledgeCardDetailsProps = {
  card: KnowledgeCardWithFaction;
  isDetailedView?: boolean;
};

export type CharacterDetailsProps = {
  character: CharacterWithFaction;
  children?: ReactNode;
};

// Faction types for grid displays
export type FactionWithKnowledgeCards = {
  id: string;
  name: string;
  description: string;
  cards: Array<{
    id: string;
    name: string;
    rank: string;
    cost: number;
    imageUrl: string;
  }>;
};

export type FactionWithCharacters = {
  id: string;
  name: string;
  description: string;
  characters: Array<{
    id: string;
    name: string;
    imageUrl: string;
    positioningTags: PositioningTag[];
  }>;
};

export type FactionCharactersProps = {
  faction: FactionWithCharacters;
};
export type GotoResult = {
  url: string;
  type:
    | 'character'
    | 'card'
    | 'entity'
    | 'item'
    | 'special-skill-cat'
    | 'special-skill-mouse'
    | 'doc'
    | 'character-skill'
    | 'buff'
    | 'itemGroup';
  name: string;
  description: string | undefined;
  imageUrl: string | undefined;
  // Optional metadata for previews
  factionId?: FactionId; // For characters
  ownerName?: string; // For character skills
  ownerFactionId?: FactionId; // For character skills (owner's faction)
  // Leveled skill metadata
  skillLevel?: number; // When query specified like "2级技能名"
  skillType?: 'passive' | 'active' | 'weapon1' | 'weapon2';
  skillLevelDescription?: string; // Description for that level, if any
};

// Narrowed category hints used to disambiguate goto targets
export const CATEGORY_HINTS = ['知识卡', '特技', '道具', '衍生物', '技能', '状态', '组合'] as const;
export type CategoryHint = (typeof CATEGORY_HINTS)[number];

// Generic callback types
export type CharacterSelectionHandler = (characterId: string) => void;
export type KnowledgeCardSelectionHandler = (cardId: string) => void;

// Base card types for filtering/sorting
export type BaseKnowledgeCard = {
  id: string;
  name: string;
  rank: string;
  cost: number;
  imageUrl: string;
};

export type BaseCharacter = {
  id: string;
  name: string;
  imageUrl: string;
  positioningTags: PositioningTag[];
};

// Filter types
export type CharacterFilterOptions = {
  positioningTags: PositioningTagName[];
};

export type CharacterFilterState = {
  selectedPositioningTags: PositioningTagName[];
};
