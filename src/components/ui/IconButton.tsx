'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';

type IconButtonVariant = 'add' | 'delete' | 'edit';
export type IconButtonSize = 'xs' | 'sm' | 'md';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  'aria-label': string;
  variant: IconButtonVariant;
  size?: IconButtonSize;
};

const variantClasses: Record<IconButtonVariant, string> = {
  add: 'bg-action-success-subtle text-action-success-subtle-foreground hover:bg-action-success-subtle-hover',
  delete:
    'bg-action-danger-subtle text-action-danger-subtle-foreground hover:bg-action-danger-subtle-hover',
  edit: 'bg-action-primary-subtle text-action-primary-subtle-foreground hover:bg-action-primary-subtle-hover',
};

const sizeClasses: Record<IconButtonSize, string> = {
  xs: 'h-6 w-6 text-xs',
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
    <Button
      variant='unstyled'
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border-none font-semibold transition-colors',
        'focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </Button>
  )
);

IconButton.displayName = 'IconButton';

export default IconButton;
