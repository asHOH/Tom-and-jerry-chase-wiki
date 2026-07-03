'use client';

import React from 'react';

import { cn } from '@/lib/design';

export type NoticeVariant = 'error' | 'warning' | 'info' | 'success';

type NoticeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: NoticeVariant;
};

const noticeStyles: Record<NoticeVariant, string> = {
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-900/15 dark:text-red-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/15 dark:text-amber-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-900/15 dark:text-blue-200',
  success:
    'border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-900/15 dark:text-green-200',
};

const getDefaultAriaProps = (variant: NoticeVariant) =>
  variant === 'error'
    ? { role: 'alert', 'aria-live': 'assertive' as const }
    : { role: 'status', 'aria-live': 'polite' as const };

export default function Notice({
  variant = 'info',
  className,
  role,
  'aria-live': ariaLive,
  ...rest
}: NoticeProps) {
  const defaultAriaProps = getDefaultAriaProps(variant);

  return (
    <div
      role={role ?? defaultAriaProps.role}
      aria-live={ariaLive ?? defaultAriaProps['aria-live']}
      className={cn('rounded-lg border px-4 py-3 text-sm', noticeStyles[variant], className)}
      {...rest}
    />
  );
}
