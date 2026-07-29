import type { ReactNode } from 'react';

import { cn } from '@/lib/design';

import PageHeader from './PageHeader';

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
      <PageHeader
        title={title}
        description={description}
        descriptionVisibility={descriptionVisibility}
        actions={actions}
        className={headerClassName}
      >
        {filters ? (
          <div className={cn('mx-auto w-full max-w-2xl space-y-0 md:px-2', filtersClassName)}>
            {filters}
          </div>
        ) : null}
      </PageHeader>
      <div className={cn(contentTopSpacing === 'default' && 'mt-6 md:mt-8', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
