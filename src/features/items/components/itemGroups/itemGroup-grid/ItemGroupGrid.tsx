'use client';

import { useMemo } from 'react';

import { CatalogGrid, CatalogGridItem } from '@/components/ui/CatalogGrid';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import { itemGroups } from '@/data';

import ItemGroupCardDisplay from './ItemGroupCardDisplay';

type Props = { description?: string };

export default function ItemGroupClient({ description }: Props) {
  const filteredItemGroups = Object.values(itemGroups);
  const itemGroupCardNodes = useMemo(() => {
    return filteredItemGroups.map((itemGroup) => (
      <CatalogGridItem key={itemGroup.name} clip>
        <ItemGroupCardDisplay itemGroup={itemGroup} />
      </CatalogGridItem>
    ));
  }, [filteredItemGroups]);

  return (
    <CatalogPageShell
      title='组合'
      description={description ?? '列举目前支持的所有组合'}
      descriptionVisibility='desktop'
    >
      <CatalogGrid items={itemGroupCardNodes} minItemWidth={100} estimatedRowHeight={210} />
    </CatalogPageShell>
  );
}
