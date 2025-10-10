'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import { useAppContext } from '@/context/AppContext';
import { Buff } from '@/data/types';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import BuffAttributesCard from './BuffAttributesCard';

export default function BuffDetailClient({ buff }: { buff: Buff }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(buff.name, 'buff');

  const { isDetailedView } = useAppContext();
  if (!buff) return null;

  const sections: DetailSection[] = (
    [
      {
        key: 'description',
        title: '效果介绍',
        value: buff.description,
        detailedValue: buff.detailedDescription,
        fallbackText: '待补充',
      },
      {
        key: 'source',
        title: '效果来源',
        value: buff.source,
        detailedValue: buff.detailedSource,
        fallbackText: '待补充',
      },
      buff.stack === undefined
        ? null
        : {
            key: 'stack',
            title: '同类效果叠加方式',
            value: buff.stack,
            detailedValue: buff.detailedStack,
            fallbackText: '待补充',
          },
    ] as const
  )
    .filter(<T,>(section: T | null): section is T => section !== null)
    .map<DetailSection>(({ key, title, value, detailedValue, fallbackText }) => ({
      key,
      render: () => (
        <DetailTextSection
          title={title}
          value={value}
          detailedValue={detailedValue}
          fallbackText={fallbackText}
          isDetailedView={isDetailedView}
        />
      ),
    }));

  return (
    <DetailShell
      leftColumn={<BuffAttributesCard buff={buff} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
