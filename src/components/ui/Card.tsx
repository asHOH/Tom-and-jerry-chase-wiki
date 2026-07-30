'use client';

import React from 'react';

import { cn } from '@/lib/design';

type CardProps<E extends React.ElementType = 'div'> = {
  as?: E;
  interactive?: boolean;
} & React.ComponentPropsWithoutRef<E>;

const baseClasses =
  'rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800';
const interactiveClasses =
  'shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-500';

export default function Card<E extends React.ElementType = 'div'>({
  as,
  className,
  interactive = false,
  ...rest
}: CardProps<E>) {
  const Component = (as || 'div') as React.ElementType;
  return (
    <Component
      className={cn(baseClasses, interactive && interactiveClasses, className)}
      {...rest}
    />
  );
}
