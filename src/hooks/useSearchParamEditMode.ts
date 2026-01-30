'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const EDIT_PARAM = 'edit';

export interface UseSearchParamEditModeResult {
  /** Whether edit mode is active (URL has ?edit=1) */
  isEditMode: boolean;
  /** Enter edit mode by adding ?edit=1 to current URL */
  enterEditMode: () => void;
  /** Exit edit mode by removing ?edit from current URL */
  exitEditMode: () => void;
}

/**
 * Hook to manage edit mode via URL search parameter.
 * Edit mode is determined by the presence of `?edit=1` in the URL.
 */
export function useSearchParamEditMode(): UseSearchParamEditModeResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isEditMode = useMemo(() => {
    return searchParams.get(EDIT_PARAM) === '1';
  }, [searchParams]);

  const enterEditMode = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(EDIT_PARAM, '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const exitEditMode = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(EDIT_PARAM);
    const queryString = params.toString();
    const newPath = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newPath, { scroll: false });
  }, [router, pathname, searchParams]);

  return { isEditMode, enterEditMode, exitEditMode };
}

/**
 * Strips the edit search param from a URL path/query string.
 * Used when navigating away from a page to prevent carrying edit mode to other pages.
 */
export function stripEditParam(url: string): string {
  try {
    // Handle both full URLs and path+query strings
    const hasProtocol = url.startsWith('http://') || url.startsWith('https://');

    if (hasProtocol) {
      const parsed = new URL(url);
      parsed.searchParams.delete(EDIT_PARAM);
      return parsed.toString();
    }

    // Path + query string
    const questionIndex = url.indexOf('?');
    if (questionIndex === -1) return url;

    const path = url.slice(0, questionIndex);
    const query = url.slice(questionIndex + 1);
    const params = new URLSearchParams(query);
    params.delete(EDIT_PARAM);

    const newQuery = params.toString();
    return newQuery ? `${path}?${newQuery}` : path;
  } catch {
    return url;
  }
}

/**
 * Check if a URL has the edit param set.
 */
export function hasEditParam(url: string): boolean {
  try {
    const questionIndex = url.indexOf('?');
    if (questionIndex === -1) return false;

    const query = url.slice(questionIndex + 1);
    const params = new URLSearchParams(query);
    return params.get(EDIT_PARAM) === '1';
  } catch {
    return false;
  }
}
