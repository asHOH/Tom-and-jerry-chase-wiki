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

import { designTokens, componentTokens, createStyleFromTokens } from './design-tokens';

// Re-export design tokens for easy access
export { designTokens, componentTokens, createStyleFromTokens };

// Re-export utility functions
export {
  getCardRankColors,
  getCardCostColors,
  getPositioningTagColors,
  getPositioningTagContainerColor
} from './design-tokens';

/**
 * Design System Utilities
 * Additional helper functions for common design patterns
 */

/**
 * Create hover styles for interactive elements
 */
export const createHoverStyles = (baseStyles: React.CSSProperties) => ({
  base: baseStyles,
  hover: {
    ...baseStyles,
    backgroundColor: designTokens.colors.faction.hover,
    color: designTokens.colors.faction.hoverText,
    boxShadow: designTokens.shadows.cardHover,
    transform: 'translateY(-2px)'
  }
});

/**
 * Create responsive grid styles
 */
export const createGridStyles = (columns: number = 4) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.mobile)}, minmax(0, 1fr))`,
  gap: componentTokens.grid.gap,
  '@media (min-width: 768px)': {
    gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.tablet)}, minmax(0, 1fr))`
  },
  '@media (min-width: 1024px)': {
    gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.desktop)}, minmax(0, 1fr))`
  },
  '@media (min-width: 1280px)': {
    gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.large)}, minmax(0, 1fr))`
  },
  '@media (min-width: 1536px)': {
    gridTemplateColumns: `repeat(${Math.min(columns, componentTokens.grid.columns.extraLarge)}, minmax(0, 1fr))`
  }
});

/**
 * Create card styles with variants
 */
export const createCardStyles = (variant: 'character' | 'item' | 'details' = 'character', interactive: boolean = false) => {
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
      transform: 'translateZ(0)'
    },
    item: {
      ...baseCardStyle,
      backgroundColor: '#ffffff',
      position: 'relative' as const,
      overflow: 'hidden',
      padding: 0
    },
    details: {
      ...baseCardStyle,
      height: '100%'
    }
  };

  const baseStyle = variantStyles[variant];

  if (interactive) {
    return {
      base: baseStyle,
      hover: {
        ...baseStyle,
        boxShadow: designTokens.shadows.cardHover,
        transform: baseStyle.transform === 'translateZ(0)' 
          ? 'translateZ(0) scale(1.02)' 
          : 'scale(1.02)'
      }
    };
  }

  return { base: baseStyle };
};

/**
 * Create button styles using design tokens
 */
export const createButtonStyles = (variant: 'faction' | 'primary' | 'secondary' = 'primary') => {
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
    gap: designTokens.spacing.sm
  };

  switch (variant) {
    case 'faction':
      return createStyleFromTokens(componentTokens.factionButton.base);
    case 'primary':
      return {
        ...baseButtonStyle,
        backgroundColor: designTokens.colors.primary[500],
        color: '#ffffff',
        boxShadow: designTokens.shadows.button
      };
    case 'secondary':
      return {
        ...baseButtonStyle,
        backgroundColor: designTokens.colors.gray[200],
        color: designTokens.colors.gray[800],
        boxShadow: designTokens.shadows.button
      };
    default:
      return baseButtonStyle;
  }
};

/**
 * Generate CSS classes from design tokens for Tailwind compatibility
 */
export const generateTailwindClasses = {
  spacing: Object.entries(designTokens.spacing).reduce((acc, [key, value]) => {
    acc[key] = `p-[${value}]`;
    return acc;
  }, {} as Record<string, string>),
  
  radius: Object.entries(designTokens.radius).reduce((acc, [key, value]) => {
    acc[key] = `rounded-[${value}]`;
    return acc;
  }, {} as Record<string, string>)
};

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
      return designTokens.typography.fontWeight[key as keyof typeof designTokens.typography.fontWeight];
    default:
      return undefined;
  }
};

/**
 * Design system configuration and metadata
 */
export const designSystemMeta = {
  version: '2.0.0',
  description: 'Tom and Jerry Chase Wiki Design System',
  tokens: {
    spacing: Object.keys(designTokens.spacing).length,
    colors: Object.keys(designTokens.colors).length,
    typography: Object.keys(designTokens.typography.fontSize).length + Object.keys(designTokens.typography.fontWeight).length,
    shadows: Object.keys(designTokens.shadows).length,
    radius: Object.keys(designTokens.radius).length,
    transitions: Object.keys(designTokens.transitions).length
  },
  components: Object.keys(componentTokens)
};

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
    getToken
  },
  meta: designSystemMeta
} as const;

export default designSystem;
