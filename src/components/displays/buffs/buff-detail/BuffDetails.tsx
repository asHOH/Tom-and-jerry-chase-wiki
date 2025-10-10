'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import { useAppContext } from '@/context/AppContext';
import { Buff } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import BuffAttributesCard from './BuffAttributesCard';

export default function BuffDetailClient({ buff }: { buff: Buff }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(buff.name, 'buff');

  const { isDetailedView } = useAppContext();
  const spacing = designTokens.spacing;
  if (!buff) return null;

  const baseTextStyle: React.CSSProperties = {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  };

  const sections: DetailSection[] = (
    [
      {
        title: '效果介绍',
        text:
          isDetailedView && buff.detailedDescription
            ? buff.detailedDescription
            : (buff.description ?? '待补充'),
      },
      {
        title: '效果来源',
        text:
          isDetailedView && buff.detailedSource ? buff.detailedSource : (buff.source ?? '待补充'),
      },
      buff.stack === undefined
        ? null
        : {
            title: '同类效果叠加方式',
            text: isDetailedView && buff.detailedStack ? buff.detailedStack : buff.stack,
          },
    ] as const
  )
    .filter(<T,>(section: T | null): section is T => section !== null)
    .map<DetailSection>(({ title, text }) => ({
      title,
      content: (
        <p className='text-black dark:text-gray-200 text-lg' style={baseTextStyle}>
          <TextWithHoverTooltips text={text as string} />
        </p>
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
