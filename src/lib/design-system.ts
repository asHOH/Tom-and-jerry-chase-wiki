/**
 * Centralized Design System
 *
 * This module provides a comprehensive design system that consolidates:
 * - Design tokens (spacing, colors, typography, etc.)
 * - Component tokens (specific component styling)
 * - Utility functions for styling
 * - Component creation helpers
 *
 * This replaces the fragmented approach of UI_CONSTANTS and legacy utility files.
 * All legacy compatibility functions have been removed as of June 1, 2025.
 */

import {
  designTokens,
  componentTokens,
  createStyleFromTokens,
  getPositioningTagColors,
} from './design-tokens';
import type { FactionId } from '@/data/types';

// Re-export design tokens for easy access
export { designTokens, componentTokens, createStyleFromTokens };

// Re-export utility functions
export {
  getCardRankColors,
  getCardCostColors,
  getPositioningTagColors,
  getPositioningTagContainerColor,
  getSkillTypeColors,
  getSkillTypeContainerColor,
  getSkillLevelColors,
  getSkillLevelContainerColor,
} from './design-tokens';

/**
 * Design System Utilities
 * Additional helper functions for common design patterns
 */

/**
 * Create hover styles for interactive elements
 */
export const createHoverStyles = (baseStyles: React.CSSProperties, isDarkMode: boolean) => {
  const factionColors = designTokens.colors.faction;
  const hoverBg = isDarkMode ? factionColors.dark.hover : factionColors.hover;
  const hoverText = isDarkMode ? factionColors.dark.hoverText : factionColors.hoverText;
  const cardHoverShadow = isDarkMode
    ? designTokens.shadows.dark.cardHover
    : designTokens.shadows.cardHover;

  return {
    base: baseStyles,
    hover: {
      ...baseStyles,
      backgroundColor: hoverBg,
      color: hoverText,
      boxShadow: cardHoverShadow,
      transform: 'translateY(-2px)',
    },
  };
};

/**
 * Create responsive grid styles
 */
export const createGridStyles = (columns: number = 4) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.mobile)}, minmax(0, 1fr))`,
  gap: componentTokens.grid.gap,
  '@media (min-width: 768px)': {
    gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.tablet)}, minmax(0, 1fr))`,
  },
  '@media (min-width: 1024px)': {
    gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.desktop)}, minmax(0, 1fr))`,
  },
  '@media (min-width: 1280px)': {
    gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.large)}, minmax(0, 1fr))`,
  },
  '@media (min-width: 1536px)': {
    gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.extraLarge)}, minmax(0, 1fr))`,
  },
});

/**
 * Create card styles with variants
 */
export const createCardStyles = (
  variant: 'character' | 'item' | 'details' = 'character',
  interactive: boolean = false
) => {
  const baseCardStyle = createStyleFromTokens(componentTokens.card.base);

  const variantStyles = {
    character: {
      ...baseCardStyle,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      padding: 0,
      overflow: 'hidden',
      transition: designTokens.transitions.hover,
      transform: 'translateZ(0)',
    },
    item: {
      ...baseCardStyle,
      backgroundColor: '#ffffff',
      position: 'relative' as const,
      overflow: 'hidden',
      padding: 0,
    },
    details: {
      ...baseCardStyle,
      height: '100%',
    },
  };

  const baseStyle = variantStyles[variant];

  if (interactive) {
    return {
      base: baseStyle,
      hover: {
        ...baseStyle,
        boxShadow: designTokens.shadows.cardHover,
        transform:
          baseStyle.transform === 'translateZ(0)' ? 'translateZ(0) scale(1.02)' : 'scale(1.02)',
      },
    };
  }

  return { base: baseStyle };
};

/**
 * Create button styles using design tokens
 */
export const createButtonStyles = (
  variant: 'faction' | 'primary' | 'secondary',
  isDarkMode: boolean
) => {
  const baseButtonStyle = {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.md,
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium,
    transition: designTokens.transitions.hover,
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.sm,
  };

  switch (variant) {
    case 'faction':
      const factionColors = designTokens.colors.faction;
      return {
        ...createStyleFromTokens(componentTokens.factionButton.base),
        backgroundColor: isDarkMode ? factionColors.dark.background : factionColors.background,
        color: isDarkMode ? factionColors.dark.text : factionColors.text,
        boxShadow: isDarkMode ? designTokens.shadows.dark.card : designTokens.shadows.card,
      };
    case 'primary':
      const primaryColors = designTokens.colors.primary;
      return {
        ...baseButtonStyle,
        backgroundColor: isDarkMode ? primaryColors.dark[500] : primaryColors[500],
        color: '#ffffff',
        boxShadow: isDarkMode ? designTokens.shadows.dark.button : designTokens.shadows.button,
      };
    case 'secondary':
      const grayColors = designTokens.colors.gray;
      return {
        ...baseButtonStyle,
        backgroundColor: isDarkMode ? grayColors.dark[200] : grayColors[200],
        color: isDarkMode ? grayColors.dark[800] : grayColors[800],
        boxShadow: isDarkMode ? designTokens.shadows.dark.button : designTokens.shadows.button,
      };
    default:
      return baseButtonStyle;
  }
};

/**
 * Consistent faction filter button colors
 * - cat: yellow palette
 * - mouse: sky palette
 */
export function getFactionButtonColors(
  faction: FactionId,
  isDarkMode: boolean
): { backgroundColor: string; color: string } {
  if (faction === 'cat') {
    return isDarkMode
      ? { backgroundColor: '#38bdf8', color: '#000000' } // dark: sky-400 bg, black text
      : { backgroundColor: '#e0f2fe', color: '#0369a1' }; // light: sky-100 bg, sky-800 text
  } else {
    return isDarkMode
      ? { backgroundColor: '#fbbf24', color: '#000000' } // dark: yellow-400 bg, black text
      : { backgroundColor: '#fef9c3', color: '#b45309' }; // light: yellow-100 bg, yellow-800 text
  }
}

/**
 * Generate CSS classes from design tokens for Tailwind compatibility
 */
export const generateTailwindClasses = () => ({
  spacing: Object.entries(designTokens.spacing).reduce(
    (acc, [key, value]) => {
      acc[key] = `p-[${value}]`;
      return acc;
    },
    {} as Record<string, string>
  ),

  radius: Object.entries(designTokens.radius).reduce(
    (acc, [key, value]) => {
      acc[key] = `rounded-[${value}]`;
      return acc;
    },
    {} as Record<string, string>
  ),
});

/**
 * Type-safe design token selectors
 */
export type DesignTokenPath = {
  spacing: keyof typeof designTokens.spacing;
  colors: keyof typeof designTokens.colors;
  radius: keyof typeof designTokens.radius;
  fontSize: keyof typeof designTokens.typography.fontSize;
  fontWeight: keyof typeof designTokens.typography.fontWeight;
};

/**
 * Get design token value by path
 */
export const getToken = <T extends keyof DesignTokenPath>(
  category: T,
  key: DesignTokenPath[T]
): string | number | undefined => {
  switch (category) {
    case 'spacing':
      return designTokens.spacing[key as keyof typeof designTokens.spacing];
    case 'radius':
      return designTokens.radius[key as keyof typeof designTokens.radius];
    case 'fontSize':
      return designTokens.typography.fontSize[key as keyof typeof designTokens.typography.fontSize];
    case 'fontWeight':
      return designTokens.typography.fontWeight[
        key as keyof typeof designTokens.typography.fontWeight
      ];
    default:
      return undefined;
  }
};

/**
 * Create diagonal gradient styles for minor positioning tags
 * Creates a 45-degree gradient from original color (top-left) to grey (bottom-right)
 * Note: This function is now primarily for compatibility. The same effect is available
 * directly through getPositioningTagColors with isMinor=true.
 */
export const createMinorTagGradient = (
  tagName: string,
  faction: FactionId,
  isDarkMode: boolean
): React.CSSProperties => {
  const colors = getPositioningTagColors(tagName, true, false, faction, isDarkMode);
  return colors;
};

/**
 * Design system configuration and metadata
 */
export const getDesignSystemMeta = () => ({
  version: '2.0.0',
  description: 'Tom and Jerry Chase Wiki Design System',
  tokens: {
    spacing: Object.keys(designTokens.spacing).length,
    colors: Object.keys(designTokens.colors).length,
    typography:
      Object.keys(designTokens.typography.fontSize).length +
      Object.keys(designTokens.typography.fontWeight).length,
    shadows: Object.keys(designTokens.shadows).length,
    radius: Object.keys(designTokens.radius).length,
    transitions: Object.keys(designTokens.transitions).length,
  },
  components: Object.keys(componentTokens),
});

// Default export for the entire design system
const designSystem = {
  tokens: designTokens,
  components: componentTokens,
  utils: {
    createStyleFromTokens,
    createHoverStyles,
    createGridStyles,
    createCardStyles,
    createButtonStyles,
    createMinorTagGradient,
    getToken,
  },
  meta: getDesignSystemMeta,
} as const;

export default designSystem;
