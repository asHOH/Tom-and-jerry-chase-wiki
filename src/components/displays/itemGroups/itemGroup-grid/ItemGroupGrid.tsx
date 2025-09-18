'use client';

import Link from 'next/link';
import ItemGroupCardDisplay from './ItemGroupCardDisplay';
import { itemGroups } from '@/data';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import { useMobile } from '@/hooks/useMediaQuery';

export default function ItemGroupClient() {
  // Multi-select state for filters
  const isMobile = useMobile();

  const filteredItemGroups = Object.values(itemGroups);

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
        <PageTitle>道具组</PageTitle>
        {!isMobile && <PageDescription>列举目前支持的所有道具组</PageDescription>}
      </header>
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {filteredItemGroups.map((itemGroup) => (
          <div
            key={itemGroup.name}
            className='character-card transform transition-transform hover:-translate-y-1 overflow-hidden rounded-lg'
          >
            <Link href={`/itemGroups/${encodeURIComponent(itemGroup.name)}`} className='block'>
              <ItemGroupCardDisplay itemGroup={itemGroup} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
