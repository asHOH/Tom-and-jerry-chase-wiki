'use client';

import { useMobile } from '@/hooks/useMediaQuery';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import Link from '@/components/Link';
import { itemGroups } from '@/data';

import ItemGroupCardDisplay from './ItemGroupCardDisplay';

type Props = { description?: string };

export default function ItemGroupClient({ description }: Props) {
  const isMobile = useMobile();
  const filteredItemGroups = Object.values(itemGroups);

  return (
    <CatalogPageShell
      title='组合'
      description={description ?? '列举目前支持的所有组合'}
      descriptionVisibility='desktop'
    >
      <div
        className='auto-fit-grid grid-container grid gap-4'
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
    </CatalogPageShell>
  );
}
