'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/design';

export type IconButtonVariant = 'add' | 'delete' | 'edit';
export type IconButtonSize = 'xs' | 'sm' | 'md';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  'aria-label': string;
  variant: IconButtonVariant;
  size?: IconButtonSize;
};

const variantClasses: Record<IconButtonVariant, string> = {
  add: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/80 dark:text-green-200 dark:hover:bg-green-800/90',
  delete:
    'bg-red-200 text-red-800 hover:bg-red-300 dark:bg-red-900/90 dark:text-red-100 dark:hover:bg-red-800',
  edit: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/80 dark:text-blue-200 dark:hover:bg-blue-800/90',
};

const sizeClasses: Record<IconButtonSize, string> = {
  xs: 'h-4 w-4 text-xs',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-sm',
};

const iconSizeClasses: Record<IconButtonSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

export function getIconButtonIconClassName(size: IconButtonSize = 'md'): string {
  return iconSizeClasses[size];
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant, size = 'md', className, disabled, type = 'button', children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border-none font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
);

IconButton.displayName = 'IconButton';

export default IconButton;
