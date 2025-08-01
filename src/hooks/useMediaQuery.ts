'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design breakpoints
 * @param query Media query string (e.g., '(max-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    // Set initial value
    handleChange();

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Hook to detect mobile devices (screen width < 768px)
 * Consistent with Tailwind's md: breakpoint
 */
export function useMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect tablet and above devices (screen width >= 768px)
 * Consistent with Tailwind's md: breakpoint
 */
export function useTabletAndUp(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
