import type { CSSProperties } from 'react';

import type { buffTypelist, FactionId } from '@/data/types';

import { cn } from './cn';
import { designTokens, sharedPositioningTagPalettes } from './tokens';
import type { PositioningTagColorStyle } from './types';

// ============================================================================
// Internal Maps and Helpers
// ============================================================================

const positioningTagNameMap: Record<string, keyof typeof designTokens.colors.positioningTags> = {
  进攻: 'attack',
  防守: 'defense',
  追击: 'chase',
  速通: 'speedrun',
  打架: 'fight',
  翻盘: 'comeback',
  奶酪: 'cheese',
  干扰: 'disrupt',
  辅助: 'support',
  救援: 'rescue',
  破局: 'breakthrough',
  砸墙: 'wallBreak',
};

const resolvePositioningTagKey = (tagName: string, faction: FactionId) => {
  if (tagName === '后期') {
    return faction === 'mouse' ? 'lateGameMouse' : 'lateGame';
  }
  return positioningTagNameMap[tagName];
};

const skillLevelContainerClasses: Record<1 | 2 | 3, string> = {
  1: 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 dark:from-blue-900 dark:to-blue-950 dark:border-blue-800',
  2: 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 dark:from-amber-900 dark:to-amber-950 dark:border-amber-800',
  3: 'bg-gradient-to-r from-red-50 to-red-100 border border-red-300 dark:from-red-900 dark:to-red-950 dark:border-red-800',
};

const positioningTagContainerClasses: Record<
  keyof typeof designTokens.colors.positioningTags,
  string
> = {
  attack:
    'bg-gradient-to-r from-red-50 to-red-100 border border-red-200 dark:from-red-900 dark:to-red-950 dark:border-red-800',
  defense:
    'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 dark:from-blue-900 dark:to-blue-950 dark:border-blue-800',
  chase:
    'bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300 dark:from-orange-900 dark:to-orange-950 dark:border-orange-800',
  speedrun:
    'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 dark:from-emerald-900 dark:to-emerald-950 dark:border-emerald-800',
  fight:
    'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 dark:from-purple-900 dark:to-purple-950 dark:border-purple-800',
  lateGame:
    'bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-200 dark:from-gray-600 dark:to-gray-650 dark:border-gray-700',
  comeback:
    'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 dark:from-amber-900 dark:to-amber-950 dark:border-amber-800',
  cheese:
    'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 dark:from-amber-900 dark:to-amber-950 dark:border-amber-800',
  disrupt:
    'bg-gradient-to-r from-red-50 to-red-100 border border-red-200 dark:from-red-900 dark:to-red-950 dark:border-red-800',
  support:
    'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 dark:from-blue-900 dark:to-blue-950 dark:border-blue-800',
  rescue:
    'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 dark:from-emerald-900 dark:to-emerald-950 dark:border-emerald-800',
  breakthrough:
    'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 dark:from-purple-900 dark:to-purple-950 dark:border-purple-800',
  wallBreak:
    'bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300 dark:from-orange-900 dark:to-orange-950 dark:border-orange-800',
  lateGameMouse:
    'bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-200 dark:from-gray-600 dark:to-gray-650 dark:border-gray-700',
  minor: 'bg-gray-50 border border-gray-100 dark:bg-slate-800/50 dark:border-slate-700',
};

const navButtonThemes = {
  active: 'bg-blue-600 text-white dark:bg-blue-700',
  inactive:
    'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600',
  navigating: 'bg-gray-400 text-white cursor-not-allowed opacity-80 pointer-events-none',
};

const actionButtonVariants = {
  primary:
    'bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
  secondary:
    'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600 dark:border-slate-600',
  ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
};

const actionButtonSizes = {
  sm: 'text-sm px-3 py-2 rounded-md',
  md: 'text-base px-4 py-2.5 rounded-lg',
  lg: 'text-lg px-5 py-3 rounded-lg',
};

// ============================================================================
// Utility Functions
// ============================================================================

export const createStyleFromTokens = (tokenPath: Record<string, unknown>): CSSProperties => {
  if (typeof tokenPath === 'object' && tokenPath !== null) {
    const styles: CSSProperties = {};

    for (const [key, value] of Object.entries(tokenPath)) {
      if (typeof value === 'string' || typeof value === 'number') {
        (styles as Record<string, string | number>)[key] = value;
      }
    }

    return styles;
  }

  return {};
};

// Card utility functions using design tokens
export const getCardRankColors = (rank: string, includeBorder: boolean, isDarkMode: boolean) => {
  const rankKey = rank as keyof typeof designTokens.colors.rank;
  const colorScheme = designTokens.colors.rank[rankKey] || designTokens.colors.rank.default;

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    ...(includeBorder && {
      borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
    }),
  };
};

export const getCardCostColors = (cost: number, includeBorder: boolean, isDarkMode: boolean) => {
  let colorScheme;

  if (cost >= 6) {
    colorScheme = designTokens.colors.cost.high;
  } else if (cost >= 5) {
    colorScheme = designTokens.colors.cost.medium;
  } else if (cost >= 4) {
    colorScheme = designTokens.colors.cost.low;
  } else {
    colorScheme = designTokens.colors.cost.veryLow;
  }

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    ...(includeBorder && {
      borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
    }),
  };
};

// Type label utility (for preview badges like 角色/知识卡)
export const getTypeLabelColors = (type: string, isDarkMode = false) => {
  const map: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    character: 'azure',
    card: 'amber',
    item: 'emerald',
    entity: 'russet',
    'special-skill-cat': 'pink',
    'special-skill-mouse': 'violet',
    doc: 'deepGray',
    'character-skill': 'indigo',
    buff: 'amber',
    itemGroup: 'rose',
    map: 'crimson',
    fixture: 'crimson',
    mode: 'amber',
    achievement: 'indigo',
  };

  const paletteKey = map[type] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];
  const theme = isDarkMode && palette.dark ? palette.dark : palette;

  return {
    color: theme.text,
    backgroundColor: theme.background,
  };
};

// Positioning tag utility functions
export const getPositioningTagColors = (
  tagName: string,
  isMinor: boolean,
  includeBorder: boolean,
  faction: FactionId,
  isDarkMode: boolean
): PositioningTagColorStyle => {
  const tagKey = resolvePositioningTagKey(tagName, faction);
  const colorScheme = tagKey
    ? designTokens.colors.positioningTags[tagKey]
    : designTokens.colors.positioningTags.minor;

  // Base style object with consistent properties

  if (isMinor && tagKey) {
    // For minor tags, create diagonal gradient background
    const originalColorScheme = designTokens.colors.positioningTags[tagKey];
    const greyColorScheme = designTokens.colors.positioningTags.minor;

    return {
      color:
        isDarkMode && originalColorScheme.dark
          ? originalColorScheme.dark.text
          : originalColorScheme.text,
      background: `linear-gradient(135deg, ${
        isDarkMode && originalColorScheme.dark
          ? originalColorScheme.dark.background
          : originalColorScheme.background
      } 20%, ${
        isDarkMode && greyColorScheme.dark
          ? greyColorScheme.dark.background
          : greyColorScheme.background
      } 40%)`,
      borderColor: includeBorder
        ? isDarkMode && greyColorScheme.dark
          ? greyColorScheme.dark.border
          : greyColorScheme.border
        : 'transparent',
    };
  }

  if (isMinor) {
    // Fallback for minor tags without recognized tag name
    const greyColorScheme = designTokens.colors.positioningTags.minor;
    return {
      color: isDarkMode && greyColorScheme.dark ? greyColorScheme.dark.text : greyColorScheme.text,
      backgroundColor:
        isDarkMode && greyColorScheme.dark
          ? greyColorScheme.dark.background
          : greyColorScheme.background,
      borderColor: includeBorder
        ? isDarkMode && greyColorScheme.dark
          ? greyColorScheme.dark.border
          : greyColorScheme.border
        : 'transparent',
    };
  }

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    borderColor: includeBorder
      ? isDarkMode && colorScheme.dark
        ? colorScheme.dark.border
        : colorScheme.border
      : 'transparent',
  };
};

/**
 * Item type color utility
 */
export const getItemTypeColors = (itemtype: string, isDarkMode: boolean) => {
  const itemTypePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    投掷类: 'emerald',
    手持类: 'violet',
    物件类: 'azure',
    食物类: 'amber',
    流程类: 'indigo',
    其它: 'deepGray',
  };

  const paletteKey = itemTypePaletteMap[itemtype] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];
  const theme = isDarkMode && palette.dark ? palette.dark : palette;

  return {
    color: theme.text,
    backgroundColor: theme.background,
  };
};

/**
 * Item source color utility
 */
export const getItemSourceColors = (itemsource: string, isDarkMode: boolean) => {
  const itemSourcePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    常规道具: 'azure',
    地图道具: 'russet',
    技能道具: 'violet',
  };

  const paletteKey = itemSourcePaletteMap[itemsource] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];
  const theme = isDarkMode && palette.dark ? palette.dark : palette;

  return {
    color: theme.text,
    backgroundColor: theme.background,
  };
};

/**
 * Buff
 */
export const getBuffGlobalColors = (isGlobal: boolean, isDarkMode: boolean) => {
  const buffType = isGlobal ? 'medium' : 'veryLow';
  const colorScheme = designTokens.colors.cost[buffType] || designTokens.colors.skillTypes.passive;
  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
  };
};

export const getBuffTypeColors = (type: buffTypelist, isDarkMode: boolean) => {
  const buffType = type.includes('正面') ? 'veryLow' : type.includes('负面') ? 'high' : 'low';
  const colorScheme = designTokens.colors.cost[buffType] || designTokens.colors.skillTypes.passive;
  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
  };
};

/**
 * Avatar filter color utility
 * - 杰瑞: use the same brownish colors as the "砸墙" positioning tag
 * - 泰菲: grayish blue
 * - 汤姆: blue
 * - 其他: neutral gray
 */
export const getAvatarFilterColors = (
  option: '杰瑞' | '泰菲' | '汤姆' | '其他',
  isDarkMode: boolean
): { color: string; backgroundColor: string } => {
  // 杰瑞和汤姆复用 faction colors
  if (option === '杰瑞' || option === '汤姆') {
    const factionKey = option === '杰瑞' ? 'mouse' : 'cat';
    const c = designTokens.colors.factions[factionKey];
    const theme = isDarkMode ? c.dark : c.light;
    return { color: theme.text, backgroundColor: theme.background };
  }

  // 其他选项采用固定配色
  const palette = {
    泰菲: {
      light: { bg: '#D8DBF8', text: '#4453AA' },
      dark: { bg: '#4453AA', text: '#D7DAF9' },
    },
    其他: {
      light: { bg: '#e5e7eb', text: '#4b5563' },
      dark: { bg: '#374151', text: '#e5e7eb' },
    },
  } as const;

  const scheme = palette[option as keyof typeof palette];
  const theme = isDarkMode ? scheme.dark : scheme.light;
  return { color: theme.text, backgroundColor: theme.bg };
};

// Skill level utility functions
export const getSkillLevelColors = (level: number, includeBorder: boolean, isDarkMode: boolean) => {
  let colorScheme;

  if (level === 1) {
    colorScheme = designTokens.colors.skillLevels.level1;
  } else if (level === 2) {
    colorScheme = designTokens.colors.skillLevels.level2;
  } else if (level === 3) {
    colorScheme = designTokens.colors.skillLevels.level3;
  } else {
    // Default to level 1 colors for any other level
    colorScheme = designTokens.colors.skillLevels.level1;
  }

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    ...(includeBorder && {
      borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
    }),
  };
};

export const getSkillLevelContainerColor = (level: number): string => {
  if (level === 1) {
    return skillLevelContainerClasses[1];
  }
  if (level === 2) {
    return skillLevelContainerClasses[2];
  }
  if (level === 3) {
    return skillLevelContainerClasses[3];
  }
  return skillLevelContainerClasses[1];
};

export const getPositioningTagContainerColor = (
  tagName: string,
  isMinor: boolean,
  faction: FactionId
): string => {
  if (isMinor) {
    return positioningTagContainerClasses.minor;
  }

  const tagKey = resolvePositioningTagKey(tagName, faction);
  return positioningTagContainerClasses[tagKey ?? 'minor'];
};

/**
 * Entity type color utility
 */
export const getEntityTypeColors = (
  entityType: string,
  isDarkMode: boolean,
  isMinor: boolean = false
) => {
  const entityTypePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    /*投射类：绿色*/
    投射类: 'emerald',
    抛掷: 'emerald',
    平射: 'emerald',
    追踪: 'emerald',
    /*触发类：蓝色*/
    触发类: 'azure',
    触发: 'azure',
    延时: 'azure',
    遥控: 'azure',
    /*物件类：橙色*/
    物件类: 'amber',
    功能: 'amber',
    阻挡: 'amber',
    指示: 'amber',
    /*NPC：玫瑰色*/
    NPC: 'rose',
    /*变身类：黄色*/
    变身类: 'russet',
    变形: 'russet',
    变身: 'russet',
    /*特殊类：紫色*/
    特殊类: 'violet',
    特殊: 'violet',
    /*其余tag按直观感受配色*/
    拾取: 'indigo',
    交互: 'indigo',
    伤害: 'crimson',
    硬控: 'crimson',
    群体: 'crimson',
    命中: 'crimson',
    增益: 'emerald',
    复用: 'deepGray',
    巡逻: 'violet',
    彩蛋: 'violet',
    星元: 'violet',
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    let hexColor = hex.replace('#', '');
    if (hexColor.length === 3) {
      hexColor = hexColor
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const r = parseInt(hexColor.slice(0, 2), 16);
    const g = parseInt(hexColor.slice(2, 4), 16);
    const b = parseInt(hexColor.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const paletteKey = entityTypePaletteMap[entityType] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];
  const theme = isDarkMode && palette.dark ? palette.dark : palette;

  const semiTransparentBg = hexToRgba(theme.background, 0.5);
  const backgroundColor = isMinor ? semiTransparentBg : theme.background;

  return {
    color: theme.text,
    backgroundColor,
  };
};

/**
 * Map type color utility
 */
export const getMapTypeColors = (mapType: string, isDarkMode: boolean) => {
  const mapTypeColorMap: Record<
    string,
    'rescue' | 'support' | 'breakthrough' | 'wallBreak' | 'disrupt' | 'cheese' | 'lateGameMouse'
  > = {
    常规地图: 'cheese',
    娱乐地图: 'breakthrough',
    广场地图: 'wallBreak',
  };
  const skillType = mapTypeColorMap[mapType] || 'lateGameMouse';
  const colorScheme =
    designTokens.colors.positioningTags[skillType] || designTokens.colors.skillTypes.passive;
  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
  };
};

export const getMapSizeColors = (size: string, isDarkMode: boolean) => {
  const sizeColorMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    微型: 'amber',
    小型: 'emerald',
    中型: 'indigo',
    大型: 'crimson',
  };
  const paletteKey = sizeColorMap[size] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];
  const theme = isDarkMode && palette.dark ? palette.dark : palette;

  return {
    color: theme.text,
    backgroundColor: theme.background,
  };
};

export const getMapLevelColors = (level: string, isDarkMode: boolean) => {
  const levelColorMap: Record<string, 'C' | 'B' | 'A' | 'S'> = {
    见习学业: 'C',
    高级学业: 'B',
    特级学业: 'A',
    大师学业: 'S',
  };
  const skillType = levelColorMap[level] || 'C';
  const colorScheme = designTokens.colors.rank[skillType] || designTokens.colors.skillTypes.passive;

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
  };
};

/**
 * Fixture type color utility
 */
export const getFixtureTypeColors = (fixtureType: string, isDarkMode: boolean) => {
  const fixtureTypePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    平台类: 'emerald',
    地面类: 'violet',
    墙壁类: 'azure',
    组件类: 'russet',
    流程类: 'indigo',
    NPC: 'crimson',
    可交互: 'amber',
  };

  const paletteKey = fixtureTypePaletteMap[fixtureType] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];
  const theme = isDarkMode && palette.dark ? palette.dark : palette;

  return {
    color: theme.text,
    backgroundColor: theme.background,
  };
};

/**
 * Fixture source color utility
 */
export const getFixtureSourceColors = (fixtureSource: string, isDarkMode: boolean) => {
  const fixtureSourcePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    通用组件: 'amber',
    地图组件: 'violet',
    模式组件: 'indigo',
  };

  const paletteKey = fixtureSourcePaletteMap[fixtureSource] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];
  const theme = isDarkMode && palette.dark ? palette.dark : palette;

  return {
    color: theme.text,
    backgroundColor: theme.background,
  };
};

/**
 * Mode type color utility
 */
export const getModeTypeColors = (modeType: string, isDarkMode: boolean) => {
  const modeTypePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    经典模式: 'emerald',
    休闲模式: 'violet',
    特殊模式: 'azure',
  };

  const paletteKey = modeTypePaletteMap[modeType] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];
  const theme = isDarkMode && palette.dark ? palette.dark : palette;

  return {
    color: theme.text,
    backgroundColor: theme.background,
  };
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
  const palette = designTokens.colors.factions;
  const scheme = faction === 'cat' ? palette.cat : palette.mouse;
  const theme = isDarkMode ? scheme.dark : scheme.light;
  return { backgroundColor: theme.background, color: theme.text };
}

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

  return cn('relative z-10', layout, focus, state);
}

export type ActionButtonVariant = keyof typeof actionButtonVariants;
export type ActionButtonSize = keyof typeof actionButtonSizes;

export function getActionButtonClasses(
  variant: ActionButtonVariant = 'primary',
  size: ActionButtonSize = 'md',
  options?: { fullWidth?: boolean; loading?: boolean }
): string {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-60';
  return cn(
    base,
    actionButtonVariants[variant],
    actionButtonSizes[size],
    options?.fullWidth && 'w-full',
    options?.loading && 'cursor-progress'
  );
}
