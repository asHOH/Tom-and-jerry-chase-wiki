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

import clsx from 'clsx';

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

/**
 * Navigation button theme configurations
 */
const navButtonThemes = {
  active: 'bg-blue-600 text-white dark:bg-blue-700',
  inactive:
    'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600',
  navigating: 'bg-gray-400 text-white cursor-not-allowed opacity-80 pointer-events-none',
};

/**
 * Generates class names for navigation buttons used in TabNavigation and related header items.
 * Consolidates layout, focus states, and dynamic themes.
 */
export function getNavigationButtonClasses(
  isNavigating: boolean,
  isActive: boolean,
  isSquare: boolean = false,
  suppressActiveBackground: boolean = false
): string {
  const layout = isSquare
    ? 'flex h-10 w-10 items-center justify-center rounded-md border-none p-2 md:h-11 md:w-11 lg:p-2.5 transition-colors'
    : 'flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-md border-none px-2 py-2 text-sm transition-colors md:min-h-[44px] md:px-2.5 lg:px-3.5 lg:text-base';
  const focus =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300';

  let state = navButtonThemes.inactive;
  if (isNavigating) {
    state = navButtonThemes.navigating;
  } else if (isActive) {
    state = suppressActiveBackground ? 'text-white' : navButtonThemes.active;
  }

  return clsx('relative z-10', layout, focus, state);
}
