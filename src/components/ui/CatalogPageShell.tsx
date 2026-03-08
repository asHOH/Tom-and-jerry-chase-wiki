import type { ReactNode } from 'react';

import { cn } from '@/lib/design/cn';

import PageDescription from './PageDescription';
import PageTitle from './PageTitle';

type CatalogPageShellProps = {
  title: ReactNode;
  description?: ReactNode;
  descriptionVisibility?: 'always' | 'desktop';
  actions?: ReactNode;
  filters?: ReactNode;
  contentTopSpacing?: 'default' | 'none';
  className?: string;
  headerClassName?: string;
  filtersClassName?: string;
  contentClassName?: string;
  children: ReactNode;
};

export default function CatalogPageShell({
  title,
  description,
  descriptionVisibility = 'always',
  actions,
  filters,
  contentTopSpacing = 'default',
  className,
  headerClassName,
  filtersClassName,
  contentClassName,
  children,
}: CatalogPageShellProps) {
  return (
    <section className={cn('mx-auto w-full max-w-6xl px-2 md:p-6 dark:text-slate-200', className)}>
      <header className={cn('space-y-2 px-2 text-center md:space-y-4 md:px-4', headerClassName)}>
        <PageTitle>{title}</PageTitle>
        {description ? (
          <div
            className={descriptionVisibility === 'desktop' ? 'sr-only md:not-sr-only' : undefined}
          >
            <PageDescription>{description}</PageDescription>
          </div>
        ) : null}
        {actions ? <div className='flex justify-center md:justify-end'>{actions}</div> : null}
        {filters ? (
          <div className={cn('mx-auto w-full max-w-2xl space-y-0 md:px-2', filtersClassName)}>
            {filters}
          </div>
        ) : null}
      </header>
      <div className={cn(contentTopSpacing === 'default' && 'mt-8', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
