'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import { useAppContext } from '@/context/AppContext';
import { Buff } from '@/data/types';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import BuffAttributesCard from './BuffAttributesCard';
import CollapseCard from '@/components/ui/CollapseCard';
import SingleItemTraitsText from '../../traits/shared/SingleItemTraitsText';

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
      },
      {
        key: 'source',
        title: '效果来源',
        value: buff.source,
        detailedValue: buff.detailedSource,
      },
      buff.stack === undefined
        ? null
        : {
            key: 'stack',
            title: '同类效果叠加方式',
            value: buff.stack,
            detailedValue: buff.detailedStack,
          },
    ] as const
  )
    .filter(<T,>(section: T | null): section is T => section !== null)
    .map<DetailSection>(({ key, title, value, detailedValue }) => ({
      key,
      render: () => (
        <DetailTextSection
          title={title}
          value={value}
          detailedValue={detailedValue}
          isDetailedView={isDetailedView}
        >
          {key === 'description' && (
            <div className='-mt-4'>
              <CollapseCard
                title={`  ${buff.name}的相关互动特性`}
                size='xs'
                color='orange'
                className='pb-1 border-x-1 border-b-1 border-gray-300 dark:border-gray-700 rounded-md whitespace-pre-wrap'
              >
                <SingleItemTraitsText singleItem={{ name: buff.name, type: 'buff' }} />
              </CollapseCard>
            </div>
          )}
        </DetailTextSection>
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
