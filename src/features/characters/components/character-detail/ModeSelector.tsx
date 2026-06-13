'use client';

import React from 'react';
import { useSnapshot } from 'valtio';

import { modesEdit } from '@/data/store';
import type { CharacterRelationItem } from '@/data/types';

import RelationItemSelector from './RelationItemSelector';

type Props = {
  selected: CharacterRelationItem[];
  onSelect: (modeName: string) => void;
  disabled?: boolean;
};

const ModeSelector: React.FC<Props> = ({ selected, onSelect, disabled }) => {
  const modesSnapshot = useSnapshot(modesEdit);
  const selectedIds = new Set(selected.map(({ id }) => id));
  const options = Object.values(modesSnapshot)
    .filter(({ name }) => !selectedIds.has(name))
    .map(({ name, imageUrl }) => ({ id: name, imageUrl, imageClassName: 'rounded' }));

  return (
    <RelationItemSelector
      options={options}
      triggerAriaLabel='添加模式'
      optionAriaLabel={(id) => `选择模式 ${id}`}
      tone='purple'
      onSelect={onSelect}
      disabled={disabled}
    />
  );
};

export default ModeSelector;
