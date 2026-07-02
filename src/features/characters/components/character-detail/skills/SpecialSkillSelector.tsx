'use client';

import React from 'react';
import { useSnapshot } from 'valtio';

import { specialSkillsEdit } from '@/data/store';
import type { CharacterRelationItem, FactionId } from '@/data/types';

import RelationItemSelector from '../character-relations/RelationItemSelector';

type Props = {
  selected: CharacterRelationItem[];
  factionId: FactionId;
  onSelect: (skillName: string) => void;
  disabled?: boolean;
};

const SpecialSkillSelector: React.FC<Props> = ({ selected, factionId, onSelect, disabled }) => {
  const specialSkillsSnapshot = useSnapshot(specialSkillsEdit);
  const oppositeFaction: FactionId = factionId === 'cat' ? 'mouse' : 'cat';
  const selectedIds = new Set(selected.map(({ id }) => id));
  const options = Object.entries(specialSkillsSnapshot[oppositeFaction])
    .filter(([name]) => !selectedIds.has(name))
    .map(([name, skill]) => ({
      id: name,
      imageUrl: skill.imageUrl,
      imageClassName: 'rounded-full object-cover',
    }));

  return (
    <RelationItemSelector
      options={options}
      triggerAriaLabel='添加特技'
      optionAriaLabel={(id) => `选择特技 ${id}`}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
};

export default SpecialSkillSelector;
