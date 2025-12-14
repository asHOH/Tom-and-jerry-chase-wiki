'use client';

import { useAppContext } from '@/context/AppContext';
import { Item } from '@/data/types';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import DetailTraitsCard from '@/components/displays/shared/DetailTraitsCard';

import ItemAttributesCard from './ItemAttributesCard';

export default function ItemDetailClient({ item }: { item: Item }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(item.name, 'item');

  const { isDetailedView } = useAppContext();
  if (!item) return null;
  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='道具描述'
          value={item.description ?? null}
          detailedValue={item.detailedDescription ?? null}
          isDetailedView={isDetailedView}
        >
          <div className='-mt-4'>
            <DetailTraitsCard singleItem={{ name: item.name, type: 'item' }} />
          </div>
        </DetailTextSection>
      ),
    },
    {
      key: 'create',
      render: () => (
        <DetailTextSection
          title='生成方式'
          value={item.create ?? null}
          detailedValue={item.detailedCreate ?? null}
          isDetailedView={isDetailedView}
        />
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<ItemAttributesCard item={item} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
