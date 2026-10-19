import { isPositioningTagMinor } from '@/constants/positioningTagSequences';
import type { buffTypelist, FactionId, PositioningTagLevel } from '@/data/types';

import { gameColorPalettes } from './gameColorPalettes';
import { sharedPositioningTagPalettes } from './palettes';
import type { PositioningTagColorStyle } from './types';

// Returned CSS values adapt through game-colors.css, including in SVG and gradients.
// Callers can compose these styles without reading the current theme or parsing color literals.
// ============================================================================
// Internal Maps and Helpers
// ============================================================================

const positioningTagNameMap: Record<string, keyof typeof gameColorPalettes.positioningTags> = {
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
  keyof typeof gameColorPalettes.positioningTags,
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
    'border-border bg-gradient-to-r from-gray-100 to-gray-200 border dark:from-gray-600 dark:to-gray-700',
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
    'border-border bg-gradient-to-r from-gray-100 to-gray-200 border dark:from-gray-600 dark:to-gray-700',
  minor: 'bg-gray-50 border border-gray-100 dark:bg-slate-800/50 dark:border-slate-700',
};

// Card utility functions using game color palettes
export const getCardRankColors = (rank: string, includeBorder: boolean) => {
  const rankKey = rank as keyof typeof gameColorPalettes.rank;
  const colorScheme = gameColorPalettes.rank[rankKey] || gameColorPalettes.rank.default;

  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    ...(includeBorder && {
      borderColor: colorScheme.border,
    }),
  };
};

export const getCardCostColors = (cost: number, includeBorder: boolean) => {
  let colorScheme;

  if (cost >= 6) {
    colorScheme = gameColorPalettes.cost.high;
  } else if (cost >= 5) {
    colorScheme = gameColorPalettes.cost.medium;
  } else if (cost >= 4) {
    colorScheme = gameColorPalettes.cost.low;
  } else {
    colorScheme = gameColorPalettes.cost.veryLow;
  }

  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    ...(includeBorder && {
      borderColor: colorScheme.border,
    }),
  };
};

// Type label utility (for preview badges like 角色/知识卡)
export const getTypeLabelColors = (type: string) => {
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

  return {
    color: palette.text,
    backgroundColor: palette.background,
  };
};

// Positioning tag utility functions
export const getPositioningTagColors = (
  tagName: string,
  level: PositioningTagLevel | undefined,
  includeBorder: boolean,
  faction: FactionId
): PositioningTagColorStyle => {
  const tagKey = resolvePositioningTagKey(tagName, faction);
  const colorScheme =
    (level ?? 0) < 2 || !tagKey
      ? gameColorPalettes.positioningTags.minor
      : gameColorPalettes.positioningTags[tagKey];

  if (isPositioningTagMinor(level) && tagKey) {
    // For minor tags, create diagonal gradient background
    const originalColorScheme = gameColorPalettes.positioningTags[tagKey];
    const greyColorScheme = gameColorPalettes.positioningTags.minor;

    return {
      color: originalColorScheme.text,
      background: `linear-gradient(135deg, ${originalColorScheme.background} 20%, ${
        greyColorScheme.background
      } 40%)`,
      borderColor: includeBorder ? greyColorScheme.border : 'transparent',
    };
  }

  if (isPositioningTagMinor(level)) {
    // Fallback for minor tags without recognized tag name
    const greyColorScheme = gameColorPalettes.positioningTags.minor;
    return {
      color: greyColorScheme.text,
      backgroundColor: greyColorScheme.background,
      borderColor: includeBorder ? greyColorScheme.border : 'transparent',
    };
  }

  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    borderColor: includeBorder ? colorScheme.border : 'transparent',
  };
};

/**
 * Item type color utility
 */
export const getItemTypeColors = (itemtype: string) => {
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

  return {
    color: palette.text,
    backgroundColor: palette.background,
  };
};

/**
 * Item source color utility
 */
export const getItemSourceColors = (itemsource: string) => {
  const itemSourcePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    常规道具: 'azure',
    地图道具: 'russet',
    技能道具: 'violet',
  };

  const paletteKey = itemSourcePaletteMap[itemsource] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];

  return {
    color: palette.text,
    backgroundColor: palette.background,
  };
};

/**
 * Buff
 */
export const getBuffTypeColors = (type: buffTypelist) => {
  const buffTypePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    状态: 'amber',
    瞬时效果: 'violet',
    持续效果: 'azure',
    属性: 'crimson',
  };

  const paletteKey = buffTypePaletteMap[type] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];

  return {
    color: palette.text,
    backgroundColor: palette.background,
  };
};

type KnowledgeCardGroupMetaColor = keyof typeof gameColorPalettes.knowledgeCardGroupMeta;

export const getKnowledgeCardGroupMetaColors = (role: KnowledgeCardGroupMetaColor) => {
  const scheme = gameColorPalettes.knowledgeCardGroupMeta[role];

  return {
    color: scheme.text,
    backgroundColor: scheme.background,
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
  option: '杰瑞' | '泰菲' | '汤姆' | '其他'
): { color: string; backgroundColor: string } => {
  // 杰瑞和汤姆复用 faction colors
  if (option === '杰瑞' || option === '汤姆') {
    const factionKey = option === '杰瑞' ? 'mouse' : 'cat';
    const c = gameColorPalettes.factions[factionKey];

    return { color: c.text, backgroundColor: c.background };
  }

  const scheme =
    option === '泰菲' ? gameColorPalettes.avatars.tuffy : gameColorPalettes.avatars.other;

  return { color: scheme.text, backgroundColor: scheme.background };
};

// Skill level utility functions
export const getSkillLevelColors = (level: number, includeBorder: boolean) => {
  let colorScheme;

  if (level === 1) {
    colorScheme = gameColorPalettes.skillLevels.level1;
  } else if (level === 2) {
    colorScheme = gameColorPalettes.skillLevels.level2;
  } else if (level === 3) {
    colorScheme = gameColorPalettes.skillLevels.level3;
  } else {
    // Default to level 1 colors for any other level
    colorScheme = gameColorPalettes.skillLevels.level1;
  }

  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    ...(includeBorder && {
      borderColor: colorScheme.border,
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
  level: PositioningTagLevel | undefined,
  faction: FactionId
): string => {
  if ((level ?? 0) < 3) {
    return positioningTagContainerClasses.minor;
  }

  const tagKey = resolvePositioningTagKey(tagName, faction);
  return positioningTagContainerClasses[tagKey ?? 'minor'];
};

/**
 * Entity type color utility
 */
export const getEntityTypeColors = (entityType: string, isMinor: boolean = false) => {
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
    遥控: 'violet',
    衍生: 'violet',
    彩蛋: 'violet',
    星元: 'violet',
  };

  const paletteKey = entityTypePaletteMap[entityType] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];

  const semiTransparentBg = `color-mix(in srgb, ${palette.background} 50%, transparent)`;
  const backgroundColor = isMinor ? semiTransparentBg : palette.background;

  return {
    color: palette.text,
    backgroundColor,
  };
};

/**
 * Map type color utility
 */
export const getMapTypeColors = (mapType: string) => {
  const mapTypeColorMap: Record<
    string,
    'rescue' | 'support' | 'breakthrough' | 'wallBreak' | 'disrupt' | 'cheese' | 'lateGameMouse'
  > = {
    常规地图: 'cheese',
    娱乐地图: 'breakthrough',
    广场地图: 'wallBreak',
  };
  const paletteKey = mapTypeColorMap[mapType] || 'lateGameMouse';
  const colorScheme = gameColorPalettes.positioningTags[paletteKey];
  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    borderColor: colorScheme.border,
  };
};

export const getMapSizeColors = (size: string) => {
  const sizeColorMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    微型: 'amber',
    小型: 'emerald',
    中型: 'indigo',
    大型: 'crimson',
  };
  const paletteKey = sizeColorMap[size] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];

  return {
    color: palette.text,
    backgroundColor: palette.background,
  };
};

export const getMapLevelColors = (level: string) => {
  const levelColorMap: Record<string, 'C' | 'B' | 'A' | 'S'> = {
    见习学业: 'C',
    高级学业: 'B',
    特级学业: 'A',
    大师学业: 'S',
  };
  const paletteKey = levelColorMap[level] || 'C';
  const colorScheme = gameColorPalettes.rank[paletteKey];

  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    borderColor: colorScheme.border,
  };
};

/**
 * Fixture type color utility
 */
export const getFixtureTypeColors = (fixtureType: string) => {
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

  return {
    color: palette.text,
    backgroundColor: palette.background,
  };
};

/**
 * Fixture source color utility
 */
export const getFixtureSourceColors = (fixtureSource: string) => {
  const fixtureSourcePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    通用组件: 'amber',
    地图组件: 'violet',
    模式组件: 'indigo',
  };

  const paletteKey = fixtureSourcePaletteMap[fixtureSource] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];

  return {
    color: palette.text,
    backgroundColor: palette.background,
  };
};

/**
 * Mode type color utility
 */
export const getModeTypeColors = (modeType: string) => {
  const modeTypePaletteMap: Record<string, keyof typeof sharedPositioningTagPalettes> = {
    经典模式: 'emerald',
    休闲模式: 'violet',
    特殊模式: 'azure',
  };

  const paletteKey = modeTypePaletteMap[modeType] || 'deepGray';
  const palette = sharedPositioningTagPalettes[paletteKey];

  return {
    color: palette.text,
    backgroundColor: palette.background,
  };
};

/**
 * Consistent faction filter button colors
 * - cat: blue palette
 * - mouse: brown palette
 */
export function getFactionButtonColors(faction: FactionId): {
  backgroundColor: string;
  color: string;
} {
  const palette = gameColorPalettes.factions;
  const scheme = faction === 'cat' ? palette.cat : palette.mouse;

  return { backgroundColor: scheme.background, color: scheme.text };
}
