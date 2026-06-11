'use client';

import React, { forwardRef } from 'react';
import type { LinkProps as NextLinkProps } from 'next/link';

import {
  cn,
  getActionButtonClasses,
  type ActionButtonSize,
  type ActionButtonVariant,
} from '@/lib/design';
import Link from '@/components/Link';

type ButtonLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  NextLinkProps & {
    variant?: ActionButtonVariant;
    size?: ActionButtonSize;
    fullWidth?: boolean;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    preserveEditParam?: boolean;
    children: React.ReactNode;
  };

const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leadingIcon,
      trailingIcon,
      preserveEditParam = false,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <Link
        ref={ref}
        className={cn(getActionButtonClasses(variant, size, { fullWidth }), className)}
        preserveEditParam={preserveEditParam}
        {...rest}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </Link>
    );
  }
);

ButtonLink.displayName = 'ButtonLink';

export default ButtonLink;
