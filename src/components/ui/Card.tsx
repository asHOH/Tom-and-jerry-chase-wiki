'use client';

import React from 'react';
import clsx from 'clsx';

type CardProps<E extends React.ElementType = 'div'> = {
  as?: E;
} & React.ComponentPropsWithoutRef<E>;

const baseClasses =
  'rounded-lg bg-white p-4 shadow-md transition-shadow duration-300 hover:shadow-lg dark:bg-slate-800 dark:border-slate-700';

export default function Card<E extends React.ElementType = 'div'>({
  as,
  className,
  ...rest
}: CardProps<E>) {
  const Component = (as || 'div') as React.ElementType;
  return <Component className={clsx(baseClasses, className)} {...rest} />;
}
