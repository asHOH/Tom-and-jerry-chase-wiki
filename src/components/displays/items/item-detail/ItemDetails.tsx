'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import { useAppContext } from '@/context/AppContext';
import { Item } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import ItemAttributesCard from './ItemAttributesCard';

export default function ItemDetailClient({ item }: { item: Item }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(item.name, 'item');

  const { isDetailedView } = useAppContext();
  const spacing = designTokens.spacing;
  if (!item) return null;

  const baseTextStyle: React.CSSProperties = {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  };

  const sections: DetailSection[] = [
    {
      title: '道具描述',
      content: (
        <p className='text-black dark:text-gray-200 text-lg' style={baseTextStyle}>
          <TextWithHoverTooltips
            text={
              item.description === undefined
                ? '待补充'
                : isDetailedView && item.detailedDescription
                  ? item.detailedDescription
                  : item.description
            }
          />
        </p>
      ),
    },
    {
      title: '生成方式',
      content: (
        <p className='text-black dark:text-gray-200 text-lg' style={baseTextStyle}>
          <TextWithHoverTooltips
            text={
              item.create === undefined
                ? '待补充'
                : isDetailedView && item.detailedCreate
                  ? item.detailedCreate
                  : item.create
            }
          />
        </p>
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
