import React from 'react';

import { cn } from '@/lib/design';

export type NoticeVariant = 'error' | 'warning' | 'info' | 'success';

type NoticeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: NoticeVariant;
};

const noticeStyles: Record<NoticeVariant, string> = {
  error: 'border-status-error-border bg-status-error text-status-error-foreground',
  warning: 'border-status-warning-border bg-status-warning text-status-warning-foreground',
  info: 'border-status-info-border bg-status-info text-status-info-foreground',
  success: 'border-status-success-border bg-status-success text-status-success-foreground',
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
