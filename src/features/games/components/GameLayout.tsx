'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/design';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';

type GameLayoutProps = {
  title: string;
  description?: string | undefined;
  children: ReactNode;
  className?: string;
};

/**
 * Consistent page layout wrapper for all mini-game pages.
 * Matches the styling pattern from ToolGrid (tools page).
 */
export default function GameLayout({ title, description, children, className }: GameLayoutProps) {
  return (
    <div
      className={cn(
        'mx-auto max-w-3xl space-y-4 p-3 md:max-w-6xl md:space-y-6 md:p-6',
        'dark:text-slate-200',
        className
      )}
    >
      <header className='mb-4 space-y-2 px-2 text-center md:mb-8 md:space-y-4 md:px-4'>
        <PageTitle>{title}</PageTitle>
        {description && <PageDescription>{description}</PageDescription>}
      </header>
      {children}
    </div>
  );
}
