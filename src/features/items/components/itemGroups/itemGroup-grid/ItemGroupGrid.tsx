'use client';

import { useMemo } from 'react';

import CatalogPageShell from '@/components/ui/CatalogPageShell';
import { VirtualGrid } from '@/components/ui/VirtualGrid';
import Link from '@/components/Link';
import { itemGroups } from '@/data';

import ItemGroupCardDisplay from './ItemGroupCardDisplay';

type Props = { description?: string };

export default function ItemGroupClient({ description }: Props) {
  const filteredItemGroups = Object.values(itemGroups);
  const itemGroupCardNodes = useMemo(() => {
    return filteredItemGroups.map((itemGroup) => (
      <div
        key={itemGroup.name}
        className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
      >
        <Link href={`/itemGroups/${encodeURIComponent(itemGroup.name)}`} className='block'>
          <ItemGroupCardDisplay itemGroup={itemGroup} />
        </Link>
      </div>
    ));
  }, [filteredItemGroups]);

  return (
    <CatalogPageShell
      title='组合'
      description={description ?? '列举目前支持的所有组合'}
      descriptionVisibility='desktop'
    >
      <VirtualGrid
        items={itemGroupCardNodes}
        rowClassName='auto-fit-grid grid-container grid'
        minItemWidth={100}
        gapPx={16}
        estimatedRowHeight={210}
      />
    </CatalogPageShell>
  );
}
