'use client';

import React, { forwardRef } from 'react';
import clsx from 'clsx';

import {
  getActionButtonClasses,
  type ActionButtonSize,
  type ActionButtonVariant,
} from '@/lib/design';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  spinnerSize?: 'sm' | 'md';
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leadingIcon,
      trailingIcon,
      spinnerSize = 'sm',
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const computedClassName = clsx(
      getActionButtonClasses(variant, size, { fullWidth, loading }),
      className
    );

    return (
      <button
        ref={ref}
        className={computedClassName}
        disabled={disabled || loading}
        aria-busy={loading}
        {...rest}
      >
        {loading ? (
          <>
            <LoadingSpinner size={spinnerSize} message='' />
            {children}
          </>
        ) : (
          <>
            {leadingIcon}
            {children}
            {trailingIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
