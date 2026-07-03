'use client';

import React from 'react';

import { cn, designTokens } from '@/lib/design';
import SectionHeader from '@/components/ui/SectionHeader';

export type DetailSection = {
  key?: React.Key;
  title?: string;
  headerContent?: React.ReactNode;
  content: React.ReactNode;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
};

type SharedProps = React.HTMLAttributes<HTMLDivElement>;

type DetailShellProps = {
  leftColumn: React.ReactNode;
  sections: DetailSection[];
  gap?: string;
  containerProps?: SharedProps;
  layoutProps?: SharedProps;
  leftColumnProps?: SharedProps;
  rightColumnProps?: SharedProps;
};

function DetailShell({
  leftColumn,
  sections,
  gap = designTokens.spacing.xl,
  containerProps,
  layoutProps,
  leftColumnProps,
  rightColumnProps,
}: DetailShellProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap,
    ...containerProps?.style,
  };

  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    gap,
    ...layoutProps?.style,
  };

  const leftStyle: React.CSSProperties = {
    ...leftColumnProps?.style,
  };

  const rightStyle: React.CSSProperties = {
    ...rightColumnProps?.style,
  };

  return (
    <div {...containerProps} className={cn(containerProps?.className)} style={containerStyle}>
      <div
        {...layoutProps}
        className={cn('flex flex-col md:flex-row', layoutProps?.className)}
        style={layoutStyle}
      >
        <div
          {...leftColumnProps}
          className={cn('md:w-1/3', leftColumnProps?.className)}
          style={leftStyle}
        >
          {leftColumn}
        </div>
        <div
          {...rightColumnProps}
          className={cn('space-y-3 md:w-2/3', rightColumnProps?.className)}
          style={rightStyle}
        >
          {sections.map((section, index) => {
            const key = section.key ?? index;

            return (
              <div
                key={key}
                className={cn(section.containerClassName)}
                style={section.containerStyle}
              >
                {section.title ? (
                  <SectionHeader title={section.title}>{section.headerContent}</SectionHeader>
                ) : null}
                {section.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DetailShell;
