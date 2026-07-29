'use client';

import { useMemo } from 'react';

import type { ItemGroup } from '@/data/types';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { CatalogGrid, CatalogGridItem } from '@/components/ui/CatalogGrid';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';

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
    <PageShell width='maximum' className='space-y-2 md:space-y-8 dark:text-slate-200'>
      <PageHeader
        title={itemGroup.name}
        description={<TextWithHoverTooltips text={itemGroup.description || ''} />}
        className='mb-4 md:mb-8'
      />
      <CatalogGrid
        items={singleItemCardNodes}
        className='mt-8'
        minItemWidth={150}
        mobileMinItemWidth={110}
        estimatedRowHeight={240}
        mobileEstimatedRowHeight={180}
      />
    </PageShell>
  );
}
