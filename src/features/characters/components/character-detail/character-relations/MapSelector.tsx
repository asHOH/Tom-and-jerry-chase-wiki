'use client';

import React from 'react';
import { useSnapshot } from 'valtio';

import { mapsEdit } from '@/data/store';
import type { CharacterRelationItem } from '@/data/types';

import RelationItemSelector from './RelationItemSelector';

type Props = {
  selected: CharacterRelationItem[];
  onSelect: (mapName: string) => void;
  disabled?: boolean;
};

const MapSelector: React.FC<Props> = ({ selected, onSelect, disabled }) => {
  const mapsSnapshot = useSnapshot(mapsEdit);
  const selectedIds = new Set(selected.map(({ id }) => id));
  const options = Object.values(mapsSnapshot)
    .filter(({ name }) => !selectedIds.has(name))
    .map(({ name, imageUrl }) => ({ id: name, imageUrl, imageClassName: 'rounded' }));

  return (
    <RelationItemSelector
      options={options}
      triggerAriaLabel='添加地图'
      optionAriaLabel={(id) => `选择地图 ${id}`}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
};

export default MapSelector;
