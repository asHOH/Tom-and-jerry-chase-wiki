'use client';

import React from 'react';

import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { maps } from '@/data/static';
import type { CharacterRelationItem } from '@/data/types';

import RelationItemSelector from './RelationItemSelector';

type Props = {
  selected: CharacterRelationItem[];
  onSelect: (mapName: string) => void;
  disabled?: boolean;
};

const MapSelector: React.FC<Props> = ({ selected, onSelect, disabled }) => {
  const editRuntime = useActiveEditRuntime();
  const mapsSnapshot = useOptionalEditSnapshot(editRuntime?.stores.maps, maps);
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
