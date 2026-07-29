'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/design';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';

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
    <PageShell width='wide' className={cn('space-y-4 md:space-y-6 dark:text-slate-200', className)}>
      <PageHeader title={title} description={description} className='mb-4 md:mb-8' />
      {children}
    </PageShell>
  );
}
