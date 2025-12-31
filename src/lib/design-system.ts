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

import type { FactionId } from '@/data/types';

import { designTokens } from './design-tokens';

/**
 * Consistent faction filter button colors
 * - cat: yellow palette
 * - mouse: sky palette
 */
export function getFactionButtonColors(
  faction: FactionId,
  isDarkMode: boolean
): { backgroundColor: string; color: string } {
  const palette = designTokens.colors.factions;
  const scheme = faction === 'cat' ? palette.cat : palette.mouse;
  const theme = isDarkMode ? scheme.dark : scheme.light;
  return { backgroundColor: theme.background, color: theme.text };
}
