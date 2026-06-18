'use client';

import { useMemo } from 'react';

import type { ItemGroup } from '@/data/types';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { CatalogGrid, CatalogGridItem } from '@/components/ui/CatalogGrid';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';

import SingleItemCardDisplay from './SingleItemCardDisplay';

export default function ItemGroupClient({ itemGroup }: { itemGroup: ItemGroup }) {
  const singleItemCardNodes = useMemo(() => {
    return itemGroup.group.map((singleItem) => (
      <CatalogGridItem key={singleItem.name} clip>
        <SingleItemCardDisplay singleItem={singleItem} />
      </CatalogGridItem>
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
      <CatalogGrid
        items={singleItemCardNodes}
        className='mt-8'
        minItemWidth={150}
        mobileMinItemWidth={110}
        estimatedRowHeight={240}
        mobileEstimatedRowHeight={180}
      />
    </div>
  );
}
