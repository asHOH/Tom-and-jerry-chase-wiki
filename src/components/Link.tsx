'use client';

import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { useNavigation } from '@/hooks/useNavigation';
import React from 'react';

type LinkProps = NextLinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    children: React.ReactNode;
  };

export const Link = ({ href, onClick, replace, ...props }: LinkProps) => {
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

    await navigate(targetPath, { replace: replace ?? false });
  };

  return <NextLink href={href} onClick={handleClick} replace={replace ?? false} {...props} />;
};

export default Link;
