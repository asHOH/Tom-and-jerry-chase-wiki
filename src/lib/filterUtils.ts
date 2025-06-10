/**
 * Centralized filtering and state management utilities
 * Consolidates filter logic used across grid components
 */

import { useState, useCallback } from 'react';

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
 * Filter items by rank
 * @param items - Items to filter
 * @param selectedRanks - Set of selected ranks to include
 * @returns Filtered items
 */
export function filterByRank<T extends { rank: string }>(
  items: T[],
  selectedRanks: Set<string>
): T[] {
  if (selectedRanks.size === 0) {
    return items; // No filters selected = show all
  }
  return items.filter((item) => selectedRanks.has(item.rank));
}

/**
 * Filter items by cost range
 * @param items - Items to filter
 * @param minCost - Minimum cost (inclusive)
 * @param maxCost - Maximum cost (inclusive)
 * @returns Filtered items
 */
export function filterByCostRange<T extends { cost: number }>(
  items: T[],
  minCost?: number,
  maxCost?: number
): T[] {
  return items.filter((item) => {
    if (minCost !== undefined && item.cost < minCost) return false;
    if (maxCost !== undefined && item.cost > maxCost) return false;
    return true;
  });
}

/**
 * Filter items by faction
 * @param items - Items to filter
 * @param factionId - Faction ID to filter by
 * @returns Filtered items
 */
export function filterByFaction<T extends { factionId: string }>(
  items: T[],
  factionId: string
): T[] {
  return items.filter((item) => item.factionId === factionId);
}

/**
 * Filter items by text search (name, description, etc.)
 * @param items - Items to filter
 * @param searchText - Text to search for
 * @param searchFields - Fields to search in
 * @returns Filtered items
 */
export function filterByTextSearch<T extends Record<string, unknown>>(
  items: T[],
  searchText: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchText.trim()) {
    return items;
  }

  const normalizedSearch = searchText.toLowerCase().trim();
  return items.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedSearch);
      }
      return false;
    })
  );
}

/**
 * Generic multi-criteria filter function
 * @param items - Items to filter
 * @param filters - Array of filter functions
 * @returns Items that pass all filters
 */
export function applyMultipleFilters<T>(items: T[], filters: Array<(item: T) => boolean>): T[] {
  return items.filter((item) => filters.every((filter) => filter(item)));
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
 * Create a cost range filter function
 * @param minCost - Minimum cost
 * @param maxCost - Maximum cost
 * @returns Filter function
 */
export const createCostFilter =
  (minCost?: number, maxCost?: number) =>
  <T extends { cost: number }>(item: T): boolean => {
    if (minCost !== undefined && item.cost < minCost) return false;
    if (maxCost !== undefined && item.cost > maxCost) return false;
    return true;
  };

/**
 * Predefined rank options for UI components
 */
export const RANK_OPTIONS = ['S', 'A', 'B', 'C'] as const;

/**
 * Predefined cost ranges for filtering
 */
export const COST_RANGES = [
  { label: '低费 (1-2)', min: 1, max: 2 },
  { label: '中费 (3-4)', min: 3, max: 4 },
  { label: '高费 (5-6)', min: 5, max: 6 },
  { label: '超高费 (7+)', min: 7, max: Infinity },
] as const;
