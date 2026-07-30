'use client';

import React from 'react';

import { cn } from '@/lib/design';

type CardProps<E extends React.ElementType = 'div'> = {
  as?: E;
  bordered?: boolean;
  interactive?: boolean;
} & React.ComponentPropsWithoutRef<E>;

const baseClasses = 'rounded-lg bg-white p-4 dark:bg-slate-800';
const borderedClasses = 'border border-gray-200 dark:border-slate-700';
const interactiveClasses = 'shadow-sm transition-shadow duration-200 hover:shadow-md';
const interactiveBorderClasses =
  'transition-[border-color,box-shadow] hover:border-blue-300 dark:hover:border-blue-500';

export default function Card<E extends React.ElementType = 'div'>({
  as,
  bordered = false,
  className,
  interactive = false,
  ...rest
}: CardProps<E>) {
  const Component = (as || 'div') as React.ElementType;
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
