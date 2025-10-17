'use client';

import React from 'react';
import clsx from 'clsx';
import SectionHeader from '@/components/ui/SectionHeader';
import { designTokens } from '@/lib/design-tokens';

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

const DEFAULT_CARD_CLASSNAMES = 'card dark:bg-slate-800 dark:border-slate-700 mb-8';
const DEFAULT_CARD_PADDING = {
  padding: designTokens.spacing.lg,
};

export function DetailShell({
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

    const cardClassName = clsx(
      variant === 'default' && DEFAULT_CARD_CLASSNAMES,
      variant === 'ghost' && 'rounded-lg border border-dashed border-slate-400/60 mb-8 p-6',
      section.cardOptions?.className
    );

    const cardStyle = {
      ...(variant === 'default' ? DEFAULT_CARD_PADDING : {}),
      ...section.cardOptions?.style,
    } satisfies React.CSSProperties;

    return (
      <div className={cardClassName} style={cardStyle} data-testid={section.cardOptions?.testId}>
        {children}
      </div>
    );
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
          className={clsx('md:w-2/3 space-y-3', rightColumnProps?.className)}
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
