import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/design';

type PageTitleProps = ComponentPropsWithoutRef<'h1'> & {
  as?: 'h1' | 'p';
};

export default function PageTitle({
  as: Component = 'h1',
  className,
  style,
  ...props
}: PageTitleProps) {
  return (
    <Component
      className={cn(
        'py-3 text-4xl leading-tight font-bold tracking-tight text-blue-600 md:text-5xl dark:text-blue-400',
        className
      )}
      style={{ ...style, fontFamily: 'var(--font-display-stack)' }}
      {...props}
    />
  );
}
