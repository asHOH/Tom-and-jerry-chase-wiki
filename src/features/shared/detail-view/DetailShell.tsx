'use client';

import React from 'react';
import clsx from 'clsx';

import { designTokens } from '@/lib/design';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

type CardVariant = 'default' | 'ghost' | 'none';

type CardOptions = {
  variant?: CardVariant;
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
};

type BaseSection = {
  key?: React.Key;
  title?: string;
  headerContent?: React.ReactNode;
  cardOptions?: CardOptions;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
};

type ContentSection = BaseSection & {
  content: React.ReactNode;
  render?: never;
};

type RenderSection = BaseSection & {
  content?: never;
  render: () => React.ReactNode;
};

export type DetailSection = ContentSection | RenderSection;

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

  const renderSectionCard = (section: DetailSection, children: React.ReactNode) => {
    const variant = section.cardOptions?.variant ?? 'default';

    if (variant === 'none') {
      return children;
    }

    if (variant === 'default') {
      return (
        <Card
          className={clsx('mb-8', section.cardOptions?.className)}
          style={{
            padding: designTokens.spacing.lg,
            ...section.cardOptions?.style,
          }}
          data-testid={section.cardOptions?.testId}
        >
          {children}
        </Card>
      );
    }

    if (variant === 'ghost') {
      return (
        <div
          className={clsx(
            'mb-8 rounded-lg border border-dashed border-slate-400/60 p-6',
            section.cardOptions?.className
          )}
          style={section.cardOptions?.style}
          data-testid={section.cardOptions?.testId}
        >
          {children}
        </div>
      );
    }

    return children;
  };

  return (
    <div {...containerProps} className={clsx(containerProps?.className)} style={containerStyle}>
      <div
        {...layoutProps}
        className={clsx('flex flex-col md:flex-row', layoutProps?.className)}
        style={layoutStyle}
      >
        <div
          {...leftColumnProps}
          className={clsx('md:w-1/3', leftColumnProps?.className)}
          style={leftStyle}
        >
          {leftColumn}
        </div>
        <div
          {...rightColumnProps}
          className={clsx('space-y-3 md:w-2/3', rightColumnProps?.className)}
          style={rightStyle}
        >
          {sections.map((section, index) => {
            const key = section.key ?? index;

            if ('render' in section) {
              return <React.Fragment key={key}>{section.render()}</React.Fragment>;
            }

            return (
              <div
                key={key}
                className={clsx(section.containerClassName)}
                style={section.containerStyle}
              >
                {section.title ? (
                  <SectionHeader title={section.title}>{section.headerContent}</SectionHeader>
                ) : null}
                {renderSectionCard(section, section.content)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DetailShell;
