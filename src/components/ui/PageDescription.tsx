import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/design';

type PageDescriptionProps = ComponentPropsWithoutRef<'p'>;

export default function PageDescription({ className, style, ...props }: PageDescriptionProps) {
  return (
    <p
      className={cn(
        'mx-auto max-w-3xl py-1 text-lg leading-8 text-gray-700 transition-colors md:py-2 md:text-xl dark:text-gray-200',
        className
      )}
      style={{ ...style, fontFamily: 'var(--font-sans-stack)' }}
      {...props}
    />
  );
}
