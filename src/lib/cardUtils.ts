/**
 * Legacy Card Utility Functions
 *
 * ⚠️  DEPRECATED: This entire file is deprecated
 * Please migrate to the design system in @/lib/design-system.ts or @/lib/design-tokens.ts
 * 
 * All functions in this file have been consolidated into the centralized design system.
 * This file will be removed in a future version.
 * 
 * Migration Guide:
 * - Import from '@/lib/design-system' instead of '@/lib/cardUtils'
 * - Use getCardRankColors() instead of getRankColor()
 * - Use getCardCostColors() instead of getCostColor()
 * - Use getPositioningTagColors() instead of getPositioningTagColor()
 * - Use design token objects instead of Tailwind classes for better consistency
 */

// Re-export from design system for temporary compatibility
export {
  getRankColor,
  getCostColor,
  getPositioningTagColor,
  getPositioningTagContainerColor,
  getCardRankColors,
  getCardCostColors,
  getPositioningTagColors
} from './design-tokens';
