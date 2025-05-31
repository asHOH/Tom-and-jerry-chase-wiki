/**
 * Centralized type definitions for component props and extended types
 * Eliminates duplication of type definitions across components
 */

import { Character, Card, PositioningTag } from '@/data';

// Extended types with faction information (used in components)
export type CharacterWithFaction = Character & {
  faction: {
    id: string;
    name: string;
  };
  imageUrl: string; // Required in components
};

export type CardWithFaction = Card & {
  faction: {
    id: string;
    name: string;
  };
  imageUrl: string; // Required in components
};

// Component prop types
export type CardItemProps = {
  id: string;
  name: string;
  rank: string;
  cost: number;
  imageUrl: string;
  onClick: (cardId: string) => void;
};

export type CharacterCardProps = {
  id: string;
  name: string;
  imageUrl: string;
  positioningTags: PositioningTag[];
  factionId: string;
  onClick: (characterId: string) => void;
};

export type CardDetailsProps = {
  card: CardWithFaction;
  isDetailedView?: boolean;
};

export type CharacterDetailsProps = {
  character: CharacterWithFaction;
  isDetailedView?: boolean;
};

// Faction types for grid displays
export type FactionWithCards = {
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
  onSelectCharacter: (characterId: string) => void;
};

export type CardGridProps = {
  faction: FactionWithCards;
  onSelectCard: (cardId: string) => void;
};

// Generic callback types
export type CharacterSelectionHandler = (characterId: string) => void;
export type CardSelectionHandler = (cardId: string) => void;

// Base card types for filtering/sorting
export type BaseCard = {
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
