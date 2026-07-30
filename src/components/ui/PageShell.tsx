import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { cn } from '@/lib/design';

export type PageShellWidth = 'narrow' | 'standard' | 'wide' | 'maximum';

const widthClasses: Record<PageShellWidth, string> = {
  narrow: 'max-w-4xl',
  standard: 'max-w-5xl',
  wide: 'max-w-6xl',
  maximum: 'max-w-7xl',
};

type PageShellProps<E extends ElementType = 'main'> = {
  as?: E;
  width?: PageShellWidth;
} & Omit<ComponentPropsWithoutRef<E>, 'as'>;

export default function PageShell<E extends ElementType = 'main'>({
  as,
  width = 'standard',
  className,
  ...props
}: PageShellProps<E>) {
  const Component = (as ?? 'main') as ElementType;

  return (
    <Component
      className={cn('text-foreground mx-auto w-full', widthClasses[width], className)}
      {...props}
    />
  );
}
