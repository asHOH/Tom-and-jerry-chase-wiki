'use client';

import React from 'react';

import { cards } from '@/data/static';
import type { CharacterRelationItem } from '@/data/types';

import RelationItemSelector from '../character-relations/RelationItemSelector';

type Props = {
  selected: CharacterRelationItem[];
  onSelect: (cardName: string) => void;
  factionId: 'cat' | 'mouse';
  disabled?: boolean;
};

const KnowledgeCardSelector: React.FC<Props> = ({ selected, onSelect, factionId, disabled }) => {
  const selectedIds = new Set(selected.map(({ id }) => id));
  const options = Object.values(cards)
    .filter(({ id, factionId: rawFactionId }) => !selectedIds.has(id) && rawFactionId === factionId)
    .map(({ id, imageUrl }) => ({ id, imageUrl }));

  return (
    <RelationItemSelector
      options={options}
      triggerAriaLabel='添加知识卡'
      optionAriaLabel={(id) => `选择知识卡 ${id}`}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
};

export default KnowledgeCardSelector;
