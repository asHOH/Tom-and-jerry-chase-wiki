/**
 * Utility functions for card styling and color management
 *
 * ⚠️  DEPRECATION NOTICE: Many functions in this file are deprecated
 * Please migrate to the design system in @/lib/design-tokens.ts
 * 
 * Migration Guide:
 * - getRankColor() → getCardRankColors() from design-tokens.ts
 * - getCostColor() → getCardCostColors() from design-tokens.ts  
 * - Use design token objects instead of Tailwind classes for better consistency
 *
 * Note: All color classes used in these functions are included in the Tailwind safelist
 * in tailwind.config.js to ensure they are not purged during the build process.
 */

/**
 * Get rank color classes based on rank
 * ⚠️  DEPRECATED: Use getCardRankColors() from @/lib/design-tokens.ts instead
 * @param rank - The rank (S, A, B, C)
 * @param includeBorder - Whether to include border classes (default: false)
 * @returns CSS class string for rank styling
 */
export const getRankColor = (rank: string, includeBorder: boolean = false): string => {
  console.warn('getRankColor is deprecated. Use getCardRankColors from @/lib/design-tokens.ts instead.');
  
  switch (rank) {
    case 'S':
      return `text-orange-600 bg-orange-100${includeBorder ? ' border-orange-300' : ''}`;
    case 'A':
      return `text-purple-600 bg-purple-100${includeBorder ? ' border-purple-300' : ''}`;
    case 'B':
      return `text-blue-600 bg-blue-100${includeBorder ? ' border-blue-300' : ''}`;
    case 'C':
      return `text-green-600 bg-green-100${includeBorder ? ' border-green-300' : ''}`;
    default:
      return `text-gray-600 bg-gray-100${includeBorder ? ' border-gray-300' : ''}`;
  }
};

/**
 * Get cost color classes based on cost value
 * ⚠️  DEPRECATED: Use getCardCostColors() from @/lib/design-tokens.ts instead
 * @param cost - The cost value
 * @param includeBorder - Whether to include border classes (default: false)
 * @returns CSS class string for cost styling
 */
export const getCostColor = (cost: number, includeBorder: boolean = false): string => {
  console.warn('getCostColor is deprecated. Use getCardCostColors from @/lib/design-tokens.ts instead.');
  
  if (cost >= 6) return `text-red-600 bg-red-100${includeBorder ? ' border-red-300' : ''}`;
  if (cost >= 4) return `text-orange-600 bg-orange-100${includeBorder ? ' border-orange-300' : ''}`;
  if (cost >= 3) return `text-yellow-600 bg-yellow-100${includeBorder ? ' border-yellow-300' : ''}`;
  return `text-green-600 bg-green-100${includeBorder ? ' border-green-300' : ''}`;
};

/**
 * Get positioning tag color classes based on tag name
 * @param tagName - The positioning tag name
 * @param isMinor - Whether this is a minor tag
 * @param includeBorder - Whether to include border classes (default: false)
 * @param faction - The faction ('cat' or 'mouse') for tags that exist in both factions
 * @returns CSS class string for positioning tag styling
 */
export const getPositioningTagColor = (tagName: string, isMinor: boolean = false, includeBorder: boolean = false, faction?: 'cat' | 'mouse'): string => {
  if (isMinor) {
    return `text-gray-600 bg-gray-100${includeBorder ? ' border-gray-300' : ''}`;
  }

  switch (tagName) {
    // Cat positioning tags
    case '进攻':
      return `text-red-600 bg-red-100${includeBorder ? ' border-red-300' : ''}`;
    case '防守':
      return `text-blue-600 bg-blue-100${includeBorder ? ' border-blue-300' : ''}`;
    case '追击':
      return `text-orange-600 bg-orange-100${includeBorder ? ' border-orange-300' : ''}`;
    case '速通':
      return `text-green-600 bg-green-100${includeBorder ? ' border-green-300' : ''}`;
    case '打架':
      return `text-purple-600 bg-purple-100${includeBorder ? ' border-purple-300' : ''}`;    case '后期':
      // Handle the shared tag based on faction
      if (faction === 'mouse') {
        return `text-teal-600 bg-teal-100${includeBorder ? ' border-teal-300' : ''}`;
      }
      // Default to cat color
      return `text-indigo-600 bg-indigo-100${includeBorder ? ' border-indigo-300' : ''}`;
    case '翻盘':
      return `text-yellow-600 bg-yellow-100${includeBorder ? ' border-yellow-300' : ''}`;
    // Mouse positioning tags
    case '奶酪':
      return `text-amber-600 bg-amber-100${includeBorder ? ' border-amber-300' : ''}`;
    case '干扰':
      return `text-pink-600 bg-pink-100${includeBorder ? ' border-pink-300' : ''}`;
    case '辅助':
      return `text-cyan-600 bg-cyan-100${includeBorder ? ' border-cyan-300' : ''}`;
    case '救援':
      return `text-emerald-600 bg-emerald-100${includeBorder ? ' border-emerald-300' : ''}`;    case '破局':
      return `text-violet-600 bg-violet-100${includeBorder ? ' border-violet-300' : ''}`;
    case '砸墙':
      return `text-stone-600 bg-stone-100${includeBorder ? ' border-stone-300' : ''}`;
    default:
      return `text-gray-600 bg-gray-100${includeBorder ? ' border-gray-300' : ''}`;
  }
};

/**
 * Get background color classes for positioning tag containers
 * @param tagName - The positioning tag name
 * @param isMinor - Whether this is a minor tag
 * @param faction - The faction ('cat' or 'mouse') for tags that exist in both factions
 * @returns CSS class string for container background styling
 */
export const getPositioningTagContainerColor = (tagName: string, isMinor: boolean = false, faction?: 'cat' | 'mouse'): string => {
  if (isMinor) {
    return 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200';
  }

  switch (tagName) {
    // Cat positioning tags
    case '进攻':
      return 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200';
    case '防守':
      return 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200';
    case '追击':
      return 'bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200';
    case '速通':
      return 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200';
    case '打架':
      return 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200';
    case '后期':
      // Handle the shared tag based on faction
      if (faction === 'mouse') {
        return 'bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200';
      }
      // Default to cat color
      return 'bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200';
    case '翻盘':
      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200';
    // Mouse positioning tags
    case '奶酪':
      return 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200';
    case '干扰':
      return 'bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200';
    case '辅助':
      return 'bg-gradient-to-r from-cyan-50 to-cyan-100 border border-cyan-200';
    case '救援':
      return 'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200';
    case '破局':
      return 'bg-gradient-to-r from-violet-50 to-violet-100 border border-violet-200';
    case '砸墙':
      return 'bg-gradient-to-r from-stone-50 to-stone-100 border border-stone-200';
    default:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200';
  }
};
