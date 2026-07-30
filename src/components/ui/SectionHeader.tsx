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
    title: 'py-2 text-2xl font-bold dark:text-white',
  },
  compact: {
    container: 'mb-4',
    title: 'text-lg font-bold text-gray-900 dark:text-gray-100',
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
    <div className={cn('flex items-center justify-between', classes.container)}>
      <div className='flex min-w-0 items-center gap-1'>
        <h2 id={id} className={cn('scroll-mt-24', classes.title)}>
          {title}
        </h2>
        {id ? (
          <a
            href={`#${id}`}
            aria-label={`链接到${title}`}
            title={`链接到“${title}”`}
            className='rounded p-1 text-gray-400 opacity-0 transition-opacity hover:text-blue-600 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:hover:text-blue-400'
          >
            <LinkIcon className='size-4' />
          </a>
        ) : null}
      </div>
      {children}
    </div>
  );
}
