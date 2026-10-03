import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/design';

type PageDescriptionProps = ComponentPropsWithoutRef<'p'>;

export default function PageDescription({ className, style, ...props }: PageDescriptionProps) {
  return (
    <p
      className={cn(
        'text-muted-foreground mx-auto max-w-3xl py-1 text-base leading-7 wrap-break-word md:py-2 md:text-lg md:leading-8',
        className
      )}
      style={{ ...style, fontFamily: 'var(--font-sans-stack)' }}
      {...props}
    />
  );
}
