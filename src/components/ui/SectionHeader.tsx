'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/design';
import { LinkIcon } from '@/components/icons/CommonIcons';

type SectionHeaderProps = {
  title: string;
  children?: ReactNode;
  id?: string;
  variant?: 'standard' | 'compact';
};

const variantClasses = {
  standard: {
    container: 'mb-3',
    title: 'text-foreground py-2 text-2xl leading-tight font-bold',
  },
  compact: {
    container: 'mb-4',
    title: 'text-foreground text-lg leading-snug font-bold',
  },
} as const;

export default function SectionHeader({
  title,
  children,
  id,
  variant = 'standard',
}: SectionHeaderProps) {
  const classes = variantClasses[variant];

  return (
    <div
      className={cn(
        'group/section flex flex-wrap items-center justify-between gap-x-3 gap-y-2',
        classes.container
      )}
    >
      <div className='flex min-w-0 items-center gap-1'>
        <h2 id={id} className={cn('wiki-anchor wrap-break-word', classes.title)}>
          {title}
        </h2>
        {id ? (
          <a
            href={`#${id}`}
            aria-label={`链接到${title}`}
            title={`链接到“${title}”`}
            className='text-muted-foreground focus-visible:ring-focus inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:outline-none sm:opacity-0 sm:group-focus-within/section:opacity-100 sm:group-hover/section:opacity-100 dark:hover:text-blue-400'
          >
            <LinkIcon className='size-4' />
          </a>
        ) : null}
      </div>
      {children}
    </div>
  );
}
