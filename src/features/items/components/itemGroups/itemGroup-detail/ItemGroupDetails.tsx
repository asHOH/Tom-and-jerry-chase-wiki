'use client';

import { getSingleItemHref } from '@/lib/singleItemTools';
import type { ItemGroup } from '@/data/types';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Link from '@/components/Link';

import SingleItemCardDisplay from './SingleItemCardDisplay';

export default function ItemGroupClient({ itemGroup }: { itemGroup: ItemGroup }) {
  return (
    <div className='mx-auto max-w-3xl space-y-2 p-2 md:max-w-6xl md:space-y-8 md:p-6 dark:text-slate-200'>
      <header className='mb-4 space-y-2 px-2 text-center md:mb-8 md:space-y-4 md:px-4'>
        <PageTitle>{itemGroup.name}</PageTitle>
        <PageDescription>
          <TextWithHoverTooltips text={itemGroup.description || ''} />
        </PageDescription>
      </header>
      <div className='auto-fit-grid grid-container mt-8 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'>
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
