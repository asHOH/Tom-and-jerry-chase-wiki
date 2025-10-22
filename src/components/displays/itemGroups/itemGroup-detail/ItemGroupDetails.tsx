'use client';

import Link from 'next/link';
import SingleItemCardDisplay from './SingleItemCardDisplay';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import type { ItemGroup } from '@/data/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { getSingleItemHref } from '@/lib/singleItemTools';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';

export default function ItemGroupClient({ itemGroup }: { itemGroup: ItemGroup }) {
  // Multi-select state for filters
  const isMobile = useMobile();

  return (
    <div
      className={
        isMobile
          ? 'max-w-3xl mx-auto p-2 space-y-2 dark:text-slate-200'
          : 'max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'text-center space-y-2 mb-4 px-2' : 'text-center space-y-4 mb-8 px-4'}
      >
        <PageTitle>{itemGroup.name}</PageTitle>
        <PageDescription>
          <TextWithHoverTooltips text={itemGroup.description || ''} />
        </PageDescription>
      </header>
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {itemGroup.group.map((singleItem) => (
          <div
            key={singleItem.name}
            className='character-card transform transition-transform hover:-translate-y-1 overflow-hidden rounded-lg'
          >
            <Link href={getSingleItemHref(singleItem)} className='block'>
              <SingleItemCardDisplay singleItem={singleItem} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
