/**
 * Centralized type definitions for component props and extended types
 * Eliminates duplication of type definitions across components
 */

import { ReactNode } from 'react';
import type { Snapshot } from 'valtio';

import { SkillType } from '@/data/types';
import { Card, Character, FactionId, PositioningTag, PositioningTagName } from '@/data';

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
  card: KnowledgeCardWithFaction | Snapshot<KnowledgeCardWithFaction>;
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
    | 'itemGroup'
    | 'map'
    | 'fixture'
    | 'mode';
  name: string;
  description: string | undefined;
  imageUrl: string | undefined;
  // Optional metadata for previews
  factionId?: FactionId; // For characters
  ownerName?: string; // For character skills
  ownerFactionId?: FactionId; // For character skills (owner's faction)
  // Leveled skill metadata
  skillLevel?: number; // When query specified like "2级技能名"
  skillType?: SkillType;
  skillLevelDescription?: string; // Description for that level, if any
};

export type GotoDisambiguationCandidate = {
  url: string;
  type: GotoResult['type'];
  name: string;
  // Display helpers for disambiguation lists (built-in on the server)
  categoryLabel: CategoryHint | string;
  kindDescription: string;
  // Optional preview metadata (best-effort)
  description?: string;
  imageUrl?: string;
  factionId?: FactionId;
  ownerName?: string;
  ownerFactionId?: FactionId;
  skillLevel?: number;
  skillType?: SkillType;
  skillLevelDescription?: string;
};

export type GotoDisambiguationResult = {
  url: string; // points to /goto/:id
  type: 'disambiguation';
  name: string; // the ambiguous base name
  description: string;
  imageUrl?: string; // first candidate's imageUrl for API consumers
  candidates: GotoDisambiguationCandidate[];
};

export type GotoResponse = GotoResult | GotoDisambiguationResult;

// Narrowed category hints used to disambiguate goto targets
export const CATEGORY_HINTS = [
  '知识卡',
  '猫知识卡',
  '鼠知识卡',
  '特技',
  '猫特技',
  '鼠特技',
  '猫角色',
  '鼠角色',
  '道具',
  '衍生物',
  '猫衍生物',
  '鼠衍生物',
  '技能',
  '状态',
  '组合',
  '地图',
  '地图组件',
  '场景物', //regarded as 地图组件
  '游戏模式',
  '模式', //regarded as 地图组件
] as const;
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
