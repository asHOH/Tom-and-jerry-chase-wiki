'use client';

import type { ItemGroup } from '@/data/types';
import TextWithHoverTooltips from '@/features/characters/components/shared/TextWithHoverTooltips';

import { getSingleItemHref } from '@/lib/singleItemTools';
import { useMobile } from '@/hooks/useMediaQuery';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Link from '@/components/Link';

import SingleItemCardDisplay from './SingleItemCardDisplay';

export default function ItemGroupClient({ itemGroup }: { itemGroup: ItemGroup }) {
  // Multi-select state for filters
  const isMobile = useMobile();

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-2 p-2 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>{itemGroup.name}</PageTitle>
        <PageDescription>
          <TextWithHoverTooltips text={itemGroup.description || ''} />
        </PageDescription>
      </header>
      <div
        className='auto-fit-grid grid-container mt-8 grid gap-4'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {itemGroup.group.map((singleItem) => (
          <div
            key={singleItem.name}
            className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
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
