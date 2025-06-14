/**
 * Centralized tooltip utilities
 * Consolidates all tooltip helper functions from CharacterDetails components
 */

// Property label mappings for tooltips
const propertyTooltipsFallback: Record<string, string> = {
  Hp上限: '健康值上限，俗称"血条"',
  Hp恢复: '每秒恢复的健康值',
  移速: '移动速度（经典之家客厅长度为4680）',
  跳跃: '跳跃高度（猫的跳跃高度为420）',
  攻击增伤: '对敌方的伤害加成',
  爪刀CD: '爪刀冷却时间 (未命中/命中)',
  爪刀范围: '爪刀攻击范围',
  推速: '推奶酪速度',
  墙缝增伤: '对墙缝的伤害加成（墙缝基础血量为100）',
};

// Faction-specific tooltips
const propertyTooltips = {
  cat: {
    normal: {
      Hp上限: '健康值上限，俗称"血条"',
      Hp恢复: '每秒恢复的健康值',
      移速: '移动速度',
      跳跃: '跳跃高度',
      攻击增伤: '对老鼠的伤害加成',
      爪刀CD: '爪刀冷却时间（未命中/命中）',
      爪刀范围: '爪刀攻击范围',
    },
    detailed: {
      Hp上限: '健康值上限（盘子的伤害是50；Hp<0时虚弱）',
      Hp恢复: '健康状态下每秒恢复的健康值',
      移速: '移动速度（汤姆为755；经典之家客厅长度为4680）',
      跳跃: '跳跃高度（猫均为420）',
      攻击增伤: '爪刀和道具对老鼠的固定伤害加成',
      爪刀CD: '爪刀冷却时间（未命中/命中）（单位：秒）',
      爪刀范围: '爪刀攻击范围（汤姆为300）',
    },
  },
  mouse: {
    normal: {
      Hp上限: '健康值上限，俗称"血条"',
      Hp恢复: '每秒恢复的健康值',
      移速: '移动速度',
      跳跃: '跳跃高度',
      推速: '推奶酪速度',
      墙缝增伤: '对墙缝的伤害加成',
    },
    detailed: {
      Hp上限: '健康值上限（爪刀的伤害是50；Hp<0时虚弱）',
      Hp恢复: '健康状态下每秒恢复的健康值',
      移速: '移动速度（杰瑞为650；经典之家客厅长度为4680）',
      跳跃: '跳跃高度（杰瑞为400；猫均为420）',
      推速: '推奶酪速度（前3分钟）',
      墙缝增伤: '对墙缝的伤害加成（墙缝基础血量为100）',
    },
  },
};

// Positioning tag tooltips
const catPositioningTagTooltips = {
  normal: {
    进攻: '擅长击倒和放飞老鼠',
    防守: '擅长守奶酪/火箭/墙缝',
    追击: '擅长追击老鼠',
    打架: '擅长与干扰位老鼠正面对抗',
    速通: '擅长在游戏初期快速建立优势、甚至胜利',
    后期: '擅长在游戏后期逐步扩大优势',
    翻盘: '擅长捕捉鼠方失误、迅速消除劣势',
  },
  detailed: {
    进攻: '擅长击倒和放飞老鼠，通常拥有较高的伤害、控制或上火箭能力',
    防守: '擅长守奶酪/火箭/墙缝，通常拥有持续性伤害能力',
    追击: '擅长追击老鼠，通常拥有较高的机动性',
    打架: '擅长与干扰位老鼠正面对抗，通常拥有霸体或减控',
    速通: '擅长在游戏初期快速建立优势、甚至胜利，通常拥有特殊的绑火箭机制',
    后期: '擅长在游戏后期逐步扩大优势，通常有至少两个强势满级技能',
    翻盘: '擅长捕捉鼠方失误、迅速消除劣势，通常有技能刷新或直接抓起老鼠的机制',
  },
};

const mousePositioningTagTooltips = {
  normal: {
    奶酪: '擅长推奶酪和搬奶酪',
    干扰: '擅长干扰猫抓老鼠或上火箭',
    辅助: '擅长为队友提供增益',
    救援: '擅长救援火箭上的队友',
    破局: '擅长突破猫的防守',
    砸墙: '擅长破坏墙缝',
    后期: '擅长在游戏后期逐步扩大优势',
  },
  detailed: {
    奶酪: '擅长推奶酪和搬奶酪，通常推速较高或拥有瞬移技能',
    干扰: '擅长干扰猫抓老鼠或上火箭，通常拥有控制技能',
    辅助: '擅长为队友提供增益，通常拥有增益技能',
    救援: '擅长救援火箭上的队友，通常拥有霸体或无敌技能',
    破局: '擅长突破猫的防守，八仙过海',
    砸墙: '擅长破坏墙缝',
    后期: '擅长在游戏后期逐步扩大优势，通常有至少两个强势满级技能',
  },
};

/**
 * Get tooltip content with fallback logic for character properties
 * @param property - Property name to get tooltip for
 * @param faction - Character faction ('cat' or 'mouse')
 * @param isDetailed - Whether to show detailed tooltip
 * @returns Tooltip content string
 */
export const getTooltipContent = (
  property: string,
  faction: 'cat' | 'mouse',
  isDetailed: boolean
): string => {
  const factionTooltips = propertyTooltips[faction];

  // Try to get detailed tooltip first if in detailed mode
  if (isDetailed && factionTooltips.detailed[property as keyof typeof factionTooltips.detailed]) {
    return factionTooltips.detailed[property as keyof typeof factionTooltips.detailed];
  }

  // Fallback to normal tooltip
  return (
    factionTooltips.normal[property as keyof typeof factionTooltips.normal] ||
    propertyTooltipsFallback[property as keyof typeof propertyTooltipsFallback] ||
    `${property}的相关信息`
  );
};

/**
 * Get tooltip content for positioning tags
 * @param tagName - Positioning tag name
 * @param faction - Character faction ('cat' or 'mouse')
 * @param isDetailed - Whether to show detailed tooltip
 * @returns Tooltip content string
 */
export const getPositioningTagTooltipContent = (
  tagName: string,
  faction: 'cat' | 'mouse',
  isDetailed: boolean
): string => {
  // Select the appropriate tooltip set based on faction
  const tooltips = faction === 'cat' ? catPositioningTagTooltips : mousePositioningTagTooltips;

  // Try to get detailed tooltip first if in detailed mode
  if (isDetailed && tooltips.detailed[tagName as keyof typeof tooltips.detailed]) {
    return tooltips.detailed[tagName as keyof typeof tooltips.detailed];
  }

  // Fallback to normal tooltip
  return tooltips.normal[tagName as keyof typeof tooltips.normal] || `${tagName}定位的相关信息`;
};

/**
 * Create tooltip content for item key cancellation mechanics
 * @param actionVerb - The action verb (e.g., "打断", "取消后摇")
 * @param isDetailed - Whether to show detailed explanation
 * @returns Tooltip content string
 */
export const getItemKeyTooltipContent = (actionVerb: string, isDetailed: boolean): string => {
  if (isDetailed) {
    return `需要手中有道具或【所在处有道具且技能在地面原地释放】时才能${actionVerb}`;
  } else {
    return `需要手中有道具`;
  }
};

/**
 * Extract action verbs from item key patterns in text
 * @param text - Text containing item key patterns
 * @returns Array of action verbs found
 */
export const extractItemKeyActions = (text: string): string[] => {
  const actions: string[] = [];
  const itemKeyPattern = /道具键\*([^（]*)/g;
  let match;

  while ((match = itemKeyPattern.exec(text)) !== null) {
    const actionVerb = match[1]?.trim();
    if (actionVerb) {
      actions.push(actionVerb);
    }
  }

  return actions;
};

/**
 * Check if text contains item key patterns
 * @param text - Text to check
 * @returns Boolean indicating if item key patterns are present
 */
export const hasItemKeyPatterns = (text: string): boolean => {
  return text.includes('道具键*');
};

/**
 * Get all available property names for tooltips
 * @param faction - Faction to get properties for
 * @returns Array of property names
 */
export const getAvailableProperties = (faction: 'cat' | 'mouse'): string[] => {
  return Object.keys(propertyTooltips[faction].normal);
};

/**
 * Get all available positioning tag names for tooltips
 * @param faction - Faction to get tags for
 * @returns Array of tag names
 */
export const getAvailablePositioningTags = (faction: 'cat' | 'mouse'): string[] => {
  const tooltips = faction === 'cat' ? catPositioningTagTooltips : mousePositioningTagTooltips;
  return Object.keys(tooltips.normal);
};
