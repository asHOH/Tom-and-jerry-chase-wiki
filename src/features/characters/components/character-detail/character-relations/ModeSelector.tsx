'use client';

import React from 'react';

import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { modes } from '@/data/static';
import type { CharacterRelationItem } from '@/data/types';

import RelationItemSelector from './RelationItemSelector';

type Props = {
  selected: CharacterRelationItem[];
  onSelect: (modeName: string) => void;
  disabled?: boolean;
};

const ModeSelector: React.FC<Props> = ({ selected, onSelect, disabled }) => {
  const editRuntime = useDraftDataRuntime();
  const modesSnapshot = useOptionalEditSnapshot(editRuntime?.stores.modes, modes);
  const selectedIds = new Set(selected.map(({ id }) => id));
  const options = Object.values(modesSnapshot)
    .filter(({ name }) => !selectedIds.has(name))
    .map(({ name, imageUrl }) => ({ id: name, imageUrl, imageClassName: 'rounded' }));

  return (
    <RelationItemSelector
      options={options}
      triggerAriaLabel='添加模式'
      optionAriaLabel={(id) => `选择模式 ${id}`}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
};

export default ModeSelector;
