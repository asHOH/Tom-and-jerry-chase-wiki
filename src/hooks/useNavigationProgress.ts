'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { proxy, useSnapshot } from 'valtio';

type NavigationProgressState = {
  targetPath: string | null;
  targetPathname: string | null;
};

const navigationProgressState = proxy<NavigationProgressState>({
  targetPath: null,
  targetPathname: null,
});

const normalizePathname = (href: string | null | undefined): string | null => {
  if (!href) return null;
  const [pathname = '/'] = href.split('?');
  if (pathname === '/') return pathname;
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

export const setNavigationTarget = (href: string | null) => {
  navigationProgressState.targetPath = href;
  navigationProgressState.targetPathname = normalizePathname(href);
};

export const useNavigationProgress = () => {
  const pathname = usePathname();
  const snapshot = useSnapshot(navigationProgressState);
  const ownsWatcherRef = useRef(false);

  useEffect(() => {
    ownsWatcherRef.current = true;
    return () => {
      ownsWatcherRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ownsWatcherRef.current) return;
    if (!snapshot.targetPathname) return;
    const normalizedPathname = normalizePathname(pathname);
    if (!normalizedPathname) return;

    const target = snapshot.targetPathname;
    const isMatch = normalizedPathname === target || normalizedPathname.startsWith(`${target}/`);
    if (isMatch) {
      setNavigationTarget(null);
    }
  }, [pathname, snapshot.targetPathname]);

  const isNavigatingTo = (href?: string): boolean => {
    if (!snapshot.targetPathname) return false;
    const normalized = normalizePathname(href);
    if (!normalized) return false;
    return (
      normalized === snapshot.targetPathname || normalized.startsWith(`${snapshot.targetPathname}/`)
    );
  };

  return {
    navigatingTo: snapshot.targetPath,
    isNavigating: Boolean(snapshot.targetPathname),
    isNavigatingTo,
  } as const;
};
