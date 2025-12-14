'use client';

import { useMobile } from '@/hooks/useMediaQuery';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Link from '@/components/Link';
import { itemGroups } from '@/data';

import ItemGroupCardDisplay from './ItemGroupCardDisplay';

type Props = { description?: string };

export default function ItemGroupClient({ description }: Props) {
  // Multi-select state for filters
  const isMobile = useMobile();

  const filteredItemGroups = Object.values(itemGroups);

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
        <PageTitle>组合</PageTitle>
        {!isMobile && <PageDescription>{description ?? '列举目前支持的所有组合'}</PageDescription>}
      </header>
      <div
        className='auto-fit-grid grid-container mt-8 grid gap-4'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {filteredItemGroups.map((itemGroup) => (
          <div
            key={itemGroup.name}
            className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
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
