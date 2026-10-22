/**
 * Centralized filtering and state management utilities
 * Consolidates filter logic used across grid components
 */

import { useCallback, useState } from 'react';

/**
 * Generic filter state management hook
 * @param initialFilters - Initial set of selected filters
 * @returns Filter state and management functions
 */
export function useFilterState<T extends string>(initialFilters: Set<T> = new Set()) {
  const [selectedFilters, setSelectedFilters] = useState<Set<T>>(initialFilters);

  const toggleFilter = useCallback((filter: T) => {
    setSelectedFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filter)) {
        newSet.delete(filter);
      } else {
        newSet.add(filter);
      }
      return newSet;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedFilters(new Set());
  }, []);

  const setFilters = useCallback((filters: Set<T>) => {
    setSelectedFilters(new Set(filters));
  }, []);

  const hasFilter = useCallback(
    (filter: T) => {
      return selectedFilters.has(filter);
    },
    [selectedFilters]
  );

  const hasAnyFilters = selectedFilters.size > 0;

  return {
    selectedFilters,
    toggleFilter,
    clearFilters,
    setFilters,
    hasFilter,
    hasAnyFilters,
  };
}

/**
 * Create a rank filter function
 * @param selectedRanks - Set of selected ranks
 * @returns Filter function
 */
export const createRankFilter =
  (selectedRanks: Set<string>) =>
  <T extends { rank: string }>(item: T): boolean => {
    return selectedRanks.size === 0 || selectedRanks.has(item.rank);
  };

/**
 * Predefined rank options for UI components
 */
export const RANK_OPTIONS = ['S', 'A', 'B', 'C'] as const;
