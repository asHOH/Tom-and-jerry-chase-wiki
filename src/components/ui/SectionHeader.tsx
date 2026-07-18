'use client';

import { ReactNode } from 'react';

import { LinkIcon } from '@/components/icons/CommonIcons';

interface SectionHeaderProps {
  title: string;
  children?: ReactNode;
  id?: string;
}

export default function SectionHeader({ title, children, id }: SectionHeaderProps) {
  return (
    <div className='mb-3 flex items-center justify-between'>
      <div className='flex min-w-0 items-center gap-1'>
        <h2 id={id} className='scroll-mt-24 py-2 text-2xl font-bold dark:text-white'>
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
