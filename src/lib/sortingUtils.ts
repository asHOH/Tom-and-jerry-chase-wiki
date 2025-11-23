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
