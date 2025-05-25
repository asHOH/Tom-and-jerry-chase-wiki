/**
 * Utility functions for card styling and color management
 */

/**
 * Get rank color classes based on rank
 * @param rank - The rank (S, A, B, C)
 * @param includeBorder - Whether to include border classes (default: false)
 * @returns CSS class string for rank styling
 */
export const getRankColor = (rank: string, includeBorder: boolean = false): string => {
  const borderSuffix = includeBorder ? ' border-orange-300' : '';
  const borderSuffixPurple = includeBorder ? ' border-purple-300' : '';
  const borderSuffixBlue = includeBorder ? ' border-blue-300' : '';
  const borderSuffixGreen = includeBorder ? ' border-green-300' : '';
  const borderSuffixGray = includeBorder ? ' border-gray-300' : '';

  switch (rank) {
    case 'S': return `text-orange-600 bg-orange-100${borderSuffix}`;
    case 'A': return `text-purple-600 bg-purple-100${borderSuffixPurple}`;
    case 'B': return `text-blue-600 bg-blue-100${borderSuffixBlue}`;
    case 'C': return `text-green-600 bg-green-100${borderSuffixGreen}`;
    default: return `text-gray-600 bg-gray-100${borderSuffixGray}`;
  }
};

/**
 * Get cost color classes based on cost value
 * @param cost - The cost value
 * @param includeBorder - Whether to include border classes (default: false)
 * @returns CSS class string for cost styling
 */
export const getCostColor = (cost: number, includeBorder: boolean = false): string => {
  const borderSuffixRed = includeBorder ? ' border-red-300' : '';
  const borderSuffixOrange = includeBorder ? ' border-orange-300' : '';
  const borderSuffixYellow = includeBorder ? ' border-yellow-300' : '';
  const borderSuffixGreen = includeBorder ? ' border-green-300' : '';

  if (cost >= 6) return `text-red-600 bg-red-100${borderSuffixRed}`;
  if (cost >= 4) return `text-orange-600 bg-orange-100${borderSuffixOrange}`;
  if (cost >= 3) return `text-yellow-600 bg-yellow-100${borderSuffixYellow}`;
  return `text-green-600 bg-green-100${borderSuffixGreen}`;
};
