import type { ReactNode } from 'react';

import { cn } from '@/lib/design';

import PageDescription from './PageDescription';
import PageTitle from './PageTitle';

type PageHeaderProps = {
  title: ReactNode;
  titleAs?: 'h1' | 'p';
  description?: ReactNode;
  descriptionVisibility?: 'always' | 'desktop';
  actions?: ReactNode;
  children?: ReactNode;
  className?: string | undefined;
  titleClassName?: string | undefined;
  descriptionClassName?: string | undefined;
};

export default function PageHeader({
  title,
  titleAs = 'h1',
  description,
  descriptionVisibility = 'always',
  actions,
  children,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <header className={cn('space-y-2 text-center md:space-y-4', className)}>
      <PageTitle as={titleAs} className={titleClassName}>
        {title}
      </PageTitle>
      {description ? (
        <div className={descriptionVisibility === 'desktop' ? 'sr-only md:not-sr-only' : undefined}>
          <PageDescription className={descriptionClassName}>{description}</PageDescription>
        </div>
      ) : null}
      {actions ? (
        <div className='flex flex-wrap items-center justify-center gap-2 md:justify-end'>
          {actions}
        </div>
      ) : null}
      {children}
    </header>
  );
}
