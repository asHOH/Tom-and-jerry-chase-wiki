// Creator information for building links
export const CREATORS = {
  dreamback: {
    name: '梦回_淦德蒸蚌',
    url: 'https://space.bilibili.com/1193776217',
    contribution: '测试数据',
  },
  momo: {
    name: '是莫莫喵',
    url: 'https://space.bilibili.com/443541296',
    contribution: '测试数据',
  },
  fanshuwa: {
    name: '凡叔哇',
    url: 'https://space.bilibili.com/273122087',
    contribution: '图片素材',
  },
};

// Project information
export const PROJECT_INFO = {
  name: '项目开源地址',
  url: 'https://github.com/asHOH/Tom-and-jerry-chase-wiki',
  description: '本项目已在GitHub开源，欢迎贡献数据、代码和建议！觉得有帮助也欢迎点star！',
};

// Structured disclaimer content - single source of truth
export const DISCLAIMER_CONTENT = {
  intro: '本网站为非营利粉丝项目，仅供学习交流。',
  copyright:
    '猫和老鼠（Tom and Jerry）角色版权归华纳兄弟娱乐公司（Warner Bros. Entertainment Inc.）所有。游戏素材版权归网易猫和老鼠手游所有。',
  takedownPolicy: '若版权方提出要求，我们将立即配合调整相关内容。反馈渠道：Github Issues。',
  testDataAttribution: {
    prefix: '特别鸣谢b站up主',
    creators: ['dreamback', 'momo'] as const,
    suffix: '提供的测试数据。',
  },
  imageAttribution: {
    prefix: '特别鸣谢b站up主',
    creators: ['fanshuwa'] as const,
    suffix: '分享的图片素材。',
  },
};

// Generate plain text version for metadata
export const DISCLAIMER_TEXT = [
  DISCLAIMER_CONTENT.intro,
  DISCLAIMER_CONTENT.copyright,
  DISCLAIMER_CONTENT.takedownPolicy,
  `${DISCLAIMER_CONTENT.testDataAttribution.prefix}${DISCLAIMER_CONTENT.testDataAttribution.creators.map((id) => CREATORS[id].name).join('、')}${DISCLAIMER_CONTENT.testDataAttribution.suffix}`,
  `${DISCLAIMER_CONTENT.imageAttribution.prefix}${DISCLAIMER_CONTENT.imageAttribution.creators.map((id) => CREATORS[id].name).join('、')}${DISCLAIMER_CONTENT.imageAttribution.suffix}`,
].join('\n');

// UI Constants for component consistency
// ⚠️  DEPRECATED: This entire section will be removed in a future version
// Please migrate to the centralized design system in @/lib/design-system.ts
//
// Migration Guide:
// - IMAGE_SIZES → componentTokens.image.dimensions from design-system.ts
// - CONTAINER_HEIGHTS → componentTokens.card.content.height / componentTokens.image.container.height
// - SPACING → designTokens.spacing from design-system.ts
// - TRANSITIONS → designTokens.transitions from design-system.ts
// - RADIUS → designTokens.radius from design-system.ts
//
// Example Migration:
// OLD: import { UI_CONSTANTS } from '@/constants';
//      className={UI_CONSTANTS.SPACING.CARD_PADDING}
// NEW: import { designTokens } from '@/lib/design-system';
//      style={{ padding: designTokens.spacing.md }}
//
// For more details, see DESIGN_SYSTEM_MIGRATION.md
export const UI_CONSTANTS = {
  // Image dimensions for different contexts
  // ⚠️  DEPRECATED: Use componentTokens.image.dimensions from design-system.ts
  IMAGE_SIZES: {
    CHARACTER_CARD: { width: 120, height: 120 },
    CARD_ITEM: { width: 140, height: 140 },
    CARD_DETAILS: { width: 220, height: 220 },
  },

  // Container heights
  // ⚠️  DEPRECATED: Use componentTokens.card.content.height or componentTokens.image.container.height
  CONTAINER_HEIGHTS: {
    IMAGE: 'h-48', // 192px - Use componentTokens.image.container.height
    CARD: 'h-64', // 256px - Use componentTokens.card.content.height
  },

  // Common spacing
  // ⚠️  DEPRECATED: Use designTokens.spacing from design-system.ts
  SPACING: {
    CARD_PADDING: 'p-4', // Use designTokens.spacing.md
    SECTION_PADDING: 'p-6', // Use designTokens.spacing.lg
    TAG_PADDING: 'px-2 py-1', // Use componentTokens.tag.base.padding
    GRID_GAP: 'gap-4', // Use componentTokens.grid.gap
  },

  // Transitions and animations
  // ⚠️  DEPRECATED: Use designTokens.transitions from design-system.ts
  TRANSITIONS: {
    HOVER_SCALE: 'hover:scale-105 transition-all duration-200', // Use designTokens.transitions.hover
    CARD_HOVER: 'hover:scale-105 transition-all duration-300', // Use designTokens.transitions.hover
    SMOOTH: 'transition-transform duration-300', // Use designTokens.transitions.normal
  },

  // Border radius
  // ⚠️  DEPRECATED: Use designTokens.radius from design-system.ts
  RADIUS: {
    CARD: 'rounded-lg', // Use designTokens.radius.lg
    CARD_TOP: 'rounded-t-lg', // Use componentTokens.image.container.borderRadius
    TAG: 'rounded', // Use designTokens.radius.sm
  },
} as const;
