'use client';

import { useMediaQuery as useMediaQueryHook } from 'usehooks-ts';

/**
 * Hook to detect mobile devices (screen width < 768px)
 * Consistent with Tailwind's md: breakpoint
 */
export function useMobile(): boolean {
  return useMediaQueryHook('(max-width: 768px)');
}
