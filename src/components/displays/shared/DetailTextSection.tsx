'use client';

import React from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import TextWithHoverTooltips from '@/components/displays/characters/shared/TextWithHoverTooltips';
import { designTokens } from '@/lib/design-tokens';

type DetailTextSectionProps = {
  title: string;
  value?: string | null | undefined;
  detailedValue?: string | null | undefined;
  isDetailedView: boolean;
  fallbackText?: string;
  headerContent?: React.ReactNode;
  children?: React.ReactNode;
};

export function DetailTextSection({
  title,
  value,
  detailedValue,
  isDetailedView,
  fallbackText = '待补充',
  headerContent,
  children,
}: DetailTextSectionProps) {
  const spacing = designTokens.spacing;
  const displayText = (() => {
    if (isDetailedView && detailedValue) {
      return detailedValue;
    }
    if (value && value.trim().length > 0) {
      return value;
    }
    return fallbackText;
  })();

  return (
    <div>
      <SectionHeader title={title}>{headerContent}</SectionHeader>
      <div
        className='card dark:bg-slate-800 dark:border-slate-700 mb-8'
        style={{ padding: spacing.md }}
      >
        <p
          className='text-black dark:text-gray-200 text-lg'
          style={{ paddingTop: spacing.xs, paddingBottom: spacing.xs, whiteSpace: 'pre-wrap' }}
        >
          <TextWithHoverTooltips text={displayText} />
        </p>
        {children ? <div className='mt-4'>{children}</div> : null}
      </div>
    </div>
  );
}

export default DetailTextSection;
