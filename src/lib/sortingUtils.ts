/**
 * Centralized sorting utilities for cards, characters, and other game entities
 * Eliminates duplication of sorting logic across components
 */

/**
 * Rank order mapping for consistent sorting
 */
export const RANK_ORDER = { S: 4, A: 3, B: 2, C: 1 } as const;

/**
 * Sort cards by rank and cost
 * Consolidates the sorting logic from CardGrid and other components
 * @param cards - Array of cards to sort
 * @returns Sorted array of cards (S > A > B > C, then by cost descending)
 */
export function sortCardsByRank<T extends { rank: string; cost: number }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const rankA = RANK_ORDER[a.rank as keyof typeof RANK_ORDER] || 0;
    const rankB = RANK_ORDER[b.rank as keyof typeof RANK_ORDER] || 0;

    // Primary sort: by rank (S > A > B > C)
    if (rankA !== rankB) {
      return rankB - rankA; // Higher rank first
    }

    // Secondary sort: by cost in descending order (highest cost first)
    return b.cost - a.cost;
  });
}

/**
 * Sort cards by cost only
 * @param cards - Array of cards to sort
 * @returns Sorted array by cost (highest first)
 */
export function sortCardsByCost<T extends { cost: number }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => b.cost - a.cost);
}

/**
 * Sort characters by name alphabetically
 * @param characters - Array of characters to sort
 * @returns Sorted array by name
 */
export function sortCharactersByName<T extends { name: string }>(characters: T[]): T[] {
  // Use Chinese collation to ensure expected ordering for CJK names (pinyin-like ordering)
  return [...characters].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

/**
 * Sort items by multiple criteria with custom comparators
 * @param items - Array of items to sort
 * @param comparators - Array of comparison functions (applied in order)
 * @returns Sorted array
 */
export function sortByMultipleCriteria<T>(
  items: T[],
  comparators: Array<(a: T, b: T) => number>
): T[] {
  return [...items].sort((a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  });
}

/**
 * Create a comparator for rank-based sorting
 * @returns Comparator function for rank sorting
 */
export const createRankComparator =
  <T extends { rank: string }>() =>
  (a: T, b: T): number => {
    const rankA = RANK_ORDER[a.rank as keyof typeof RANK_ORDER] || 0;
    const rankB = RANK_ORDER[b.rank as keyof typeof RANK_ORDER] || 0;
    return rankB - rankA; // Higher rank first
  };

/**
 * Create a comparator for cost-based sorting
 * @param ascending - Whether to sort in ascending order (default: false for descending)
 * @returns Comparator function for cost sorting
 */
export const createCostComparator =
  <T extends { cost: number }>(ascending: boolean = false) =>
  (a: T, b: T): number => {
    return ascending ? a.cost - b.cost : b.cost - a.cost;
  };

/**
 * Create a comparator for name-based sorting
 * @param ascending - Whether to sort in ascending order (default: true)
 * @returns Comparator function for name sorting
 */
export const createNameComparator =
  <T extends { name: string }>(ascending: boolean = true) =>
  (a: T, b: T): number => {
    return ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  };
