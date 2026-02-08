'use client';

import React, { forwardRef } from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';

import { useNavigation } from '@/hooks/useNavigation';
import { stripEditParam } from '@/hooks/useSearchParamEditMode';

import { checkEditModeGuard } from './ui/EditModeGuard';

type LinkProps = NextLinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    children: React.ReactNode;
    /** If true, preserves edit param when navigating (default: false) */
    preserveEditParam?: boolean;
  };

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, onClick, replace, preserveEditParam = false, ...props }, ref) => {
    const { navigate } = useNavigation();

    const handleClick = async (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      if (onClick) {
        onClick(e);
      }

      if (e.defaultPrevented) {
        return;
      }
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      if (props.target === '_blank') {
        return;
      }

      e.preventDefault();

      let targetPath: string;
      if (typeof href === 'string') {
        targetPath = href;
      } else {
        const { pathname, query } = href;
        targetPath = pathname || '';
        if (query) {
          const queryString =
            typeof query === 'string'
              ? query
              : new URLSearchParams(query as Record<string, string>).toString();

          if (queryString) {
            targetPath += `?${queryString}`;
          }
        }
      }

      // Strip edit param when navigating to different pages (unless preserveEditParam is true)
      if (!preserveEditParam) {
        targetPath = stripEditParam(targetPath);
      }

      // Check if edit mode guard is active and wants to intercept
      const canNavigate = checkEditModeGuard(targetPath);
      if (!canNavigate) {
        return; // Guard will show modal and handle navigation
      }

      await navigate(targetPath, { replace: replace ?? false });
    };

    return (
      <NextLink href={href} onClick={handleClick} replace={replace ?? false} ref={ref} {...props} />
    );
  }
);

Link.displayName = 'Link';

export default Link;
