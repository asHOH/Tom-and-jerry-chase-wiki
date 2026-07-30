import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { cn } from '@/lib/design';

type CardProps<E extends ElementType = 'div'> = {
  as?: E;
  bordered?: boolean;
  interactive?: boolean;
} & ComponentPropsWithoutRef<E>;

const baseClasses = 'bg-surface rounded-lg p-4';
const borderedClasses = 'border-border border';
const interactiveClasses = 'shadow-sm transition-shadow duration-200 hover:shadow-md';
const interactiveBorderClasses =
  'transition-[border-color,box-shadow] hover:border-blue-300 dark:hover:border-blue-500';

export default function Card<E extends ElementType = 'div'>({
  as,
  bordered = false,
  className,
  interactive = false,
  ...rest
}: CardProps<E>) {
  const Component = (as || 'div') as ElementType;
  return (
    <Component
      className={cn(
        baseClasses,
        bordered && borderedClasses,
        interactive && interactiveClasses,
        bordered && interactive && interactiveBorderClasses,
        className
      )}
      {...rest}
    />
  );
}
