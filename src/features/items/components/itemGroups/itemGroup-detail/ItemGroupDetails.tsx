'use client';

import { useMemo } from 'react';

import { getSingleItemHref } from '@/lib/singleItemTools';
import type { ItemGroup } from '@/data/types';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import { VirtualGrid } from '@/components/ui/VirtualGrid';
import Link from '@/components/Link';

import SingleItemCardDisplay from './SingleItemCardDisplay';

export default function ItemGroupClient({ itemGroup }: { itemGroup: ItemGroup }) {
  const singleItemCardNodes = useMemo(() => {
    return itemGroup.group.map((singleItem) => (
      <div
        key={singleItem.name}
        className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
      >
        <Link href={getSingleItemHref(singleItem)} className='block'>
          <SingleItemCardDisplay singleItem={singleItem} />
        </Link>
      </div>
    ));
  }, [itemGroup.group]);

  return (
    <div className='mx-auto max-w-3xl space-y-2 p-2 md:max-w-6xl md:space-y-8 md:p-6 dark:text-slate-200'>
      <header className='mb-4 space-y-2 px-2 text-center md:mb-8 md:space-y-4 md:px-4'>
        <PageTitle>{itemGroup.name}</PageTitle>
        <PageDescription>
          <TextWithHoverTooltips text={itemGroup.description || ''} />
        </PageDescription>
      </header>
      <VirtualGrid
        items={singleItemCardNodes}
        className='mt-8'
        rowClassName='auto-fit-grid grid-container grid'
        minItemWidth={120}
        gapPx={16}
        estimatedRowHeight={210}
      />
    </div>
  );
}
