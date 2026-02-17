'use client';

import React from 'react';

import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

import TextWithHoverTooltips from '../components/TextWithHoverTooltips';

type DetailTextSectionProps = {
  title: string;
  value?: string | null | undefined;
  detailedValue?: string | null | undefined;
  isDetailedView: boolean;
  fallbackText?: string;
  headerContent?: React.ReactNode;
  renderValue?: React.ReactNode;
  children?: React.ReactNode;
};

function DetailTextSection({
  title,
  value,
  detailedValue,
  isDetailedView,
  fallbackText = '待补充',
  headerContent,
  renderValue,
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
      <Card className='mb-8 p-4'>
        <p className='py-2 text-lg whitespace-pre-wrap text-black dark:text-gray-200'>
          {renderValue ?? <TextWithHoverTooltips text={displayText} />}
        </p>
        {children ? <div className='mt-4'>{children}</div> : null}
      </Card>
    </div>
  );
}

export default DetailTextSection;
