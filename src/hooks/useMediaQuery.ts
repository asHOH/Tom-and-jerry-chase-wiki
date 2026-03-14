'use client';

import { useMediaQuery as useMediaQueryHook } from 'usehooks-ts';

/**
 * Hook to detect mobile devices (screen width < 768px).
 * Mirrors Tailwind's md: breakpoint: md activates at min-width:768px,
 * so mobile is max-width:767px (no overlap at exactly 768px).
 */
export function useMobile(): boolean {
  return useMediaQueryHook('(max-width: 767px)');
}
