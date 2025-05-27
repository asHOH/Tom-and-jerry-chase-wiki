/**
 * Utility functions for card styling and color management
 *
 * Note: All color classes used in these functions are included in the Tailwind safelist
 * in tailwind.config.js to ensure they are not purged during the build process.
 */

/**
 * Get rank color classes based on rank
 * @param rank - The rank (S, A, B, C)
 * @param includeBorder - Whether to include border classes (default: false)
 * @returns CSS class string for rank styling
 */
export const getRankColor = (rank: string, includeBorder: boolean = false): string => {
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
 * @param cost - The cost value
 * @param includeBorder - Whether to include border classes (default: false)
 * @returns CSS class string for cost styling
 */
export const getCostColor = (cost: number, includeBorder: boolean = false): string => {
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
 * @returns CSS class string for positioning tag styling
 */
export const getPositioningTagColor = (tagName: string, isMinor: boolean = false, includeBorder: boolean = false): string => {
  if (isMinor) {
    return `text-gray-600 bg-gray-100${includeBorder ? ' border-gray-300' : ''}`;
  }

  switch (tagName) {
    case '进攻':
      return `text-red-600 bg-red-100${includeBorder ? ' border-red-300' : ''}`;
    case '防守':
      return `text-blue-600 bg-blue-100${includeBorder ? ' border-blue-300' : ''}`;
    case '追击':
      return `text-orange-600 bg-orange-100${includeBorder ? ' border-orange-300' : ''}`;
    case '速通':
      return `text-green-600 bg-green-100${includeBorder ? ' border-green-300' : ''}`;
    case '打架':
      return `text-purple-600 bg-purple-100${includeBorder ? ' border-purple-300' : ''}`;
    default:
      return `text-gray-600 bg-gray-100${includeBorder ? ' border-gray-300' : ''}`;
  }
};
