'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import { useAppContext } from '@/context/AppContext';
import { Item } from '@/data/types';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
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
          fallbackText='待补充'
          isDetailedView={isDetailedView}
        />
      ),
    },
    {
      key: 'create',
      render: () => (
        <DetailTextSection
          title='生成方式'
          value={item.create ?? null}
          detailedValue={item.detailedCreate ?? null}
          fallbackText='待补充'
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
