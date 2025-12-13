'use client';

import React from 'react';

import SectionHeader from '@/components/ui/SectionHeader';
import TextWithHoverTooltips from '@/components/displays/characters/shared/TextWithHoverTooltips';

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
      <div className='card mb-8 p-4 dark:border-slate-700 dark:bg-slate-800'>
        <p className='py-2 text-lg whitespace-pre-wrap text-black dark:text-gray-200'>
          <TextWithHoverTooltips text={displayText} />
        </p>
        {children ? <div className='mt-4'>{children}</div> : null}
      </div>
    </div>
  );
}

export default DetailTextSection;
