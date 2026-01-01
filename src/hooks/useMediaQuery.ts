'use client';

import { useMediaQuery as useMediaQueryHook } from 'usehooks-ts';

/**
 * Wrapper around usehooks-ts media query hook so we keep a single breakpoint helper.
 */
export function useMediaQuery(query: string): boolean {
  return useMediaQueryHook(query);
}

/**
 * Hook to detect mobile devices (screen width < 768px)
 * Consistent with Tailwind's md: breakpoint
 */
export function useMobile(): boolean {
  return useMediaQueryHook('(max-width: 768px)');
}
