import React from 'react';

import type { CharacterRelationItem, TraitRelationKind } from '@/data/types';
import {
  addCharacterRelationItem,
  createCharacterRelationItem,
} from '@/features/characters/utils/characterRelationOverlay';

type RelationSelectorToolbarProps = {
  children: React.ReactNode;
};

type RelationSelectorSlotProps = {
  title: string;
  children: React.ReactNode;
};

type CreateRelationSelectHandlerParams = {
  characterId: string;
  relationKind: TraitRelationKind;
  addRelationItem?: (
    characterId: string,
    relationKind: TraitRelationKind,
    item: CharacterRelationItem
  ) => void;
  createRelationItem?: (id: string) => CharacterRelationItem;
};

export const RelationSelectorToolbar: React.FC<RelationSelectorToolbarProps> = ({ children }) => (
  <div className='flex items-center gap-2'>{children}</div>
);

export const RelationSelectorSlot: React.FC<RelationSelectorSlotProps> = ({ title, children }) => (
  <div title={title}>{children}</div>
);

export const createRelationSelectHandler = ({
  characterId,
  relationKind,
  addRelationItem = addCharacterRelationItem,
  createRelationItem = createCharacterRelationItem,
}: CreateRelationSelectHandlerParams) => {
  return (itemId: string) => {
    addRelationItem(characterId, relationKind, createRelationItem(itemId));
  };
};
