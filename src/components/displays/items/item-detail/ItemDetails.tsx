'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import { useAppContext } from '@/context/AppContext';
import { Item } from '@/data/types';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import ItemAttributesCard from './ItemAttributesCard';
import CollapseCard from '@/components/ui/CollapseCard';
import SingleItemTraitsText from '../../traits/shared/SingleItemTraitsText';

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
            <CollapseCard
              title={`  ${item.name}的相关互动特性`}
              size='xs'
              color='orange'
              className='pb-1 border-x-1 border-b-1 border-gray-300 dark:border-gray-700 rounded-md whitespace-pre-wrap'
            >
              <SingleItemTraitsText singleItem={{ name: item.name, type: 'item' }} />
            </CollapseCard>
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
