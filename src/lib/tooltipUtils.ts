/**
 * Centralized tooltip utilities
 * Consolidates all tooltip helper functions from CharacterDetails components
 */

import type { FactionId } from '@/data/types';

// Faction-specific tooltips
const propertyTooltips = {
  cat: {
    normal: {
      Hp上限: '健康值上限，即"血条"',
      Hp恢复: '每秒恢复的健康值',
      移速: '移动速度',
      跳跃: '跳跃高度',
      攻击增伤: '对老鼠的伤害加成',
      爪刀CD: '爪刀冷却时间：未命中 (特殊爪刀未命中) / 命中 (特殊爪刀命中)',
      爪刀范围: '爪刀攻击范围',
      初始道具: '游戏开始时手持的道具',
    },
    detailed: {
      Hp上限: '健康值上限（盘子的伤害是50；Hp<0时虚弱）',
      Hp恢复: '每秒恢复的健康值',
      移速: '移动速度（汤姆为760；经典之家客厅长度为4680）',
      跳跃: '跳跃高度（猫均为420）',
      攻击增伤: '爪刀、道具和部分技能对老鼠的固定伤害加成',
      爪刀CD: '爪刀冷却时间：未命中 (特殊爪刀未命中) / 命中 (特殊爪刀命中)',
      爪刀范围: '爪刀攻击范围（汤姆为300）',
      初始道具: '游戏开始时手持的道具（大部分猫为老鼠夹）',
    },
  },
  mouse: {
    normal: {
      Hp上限: '健康值上限，即"血条"',
      Hp恢复: '每秒恢复的健康值',
      移速: '移动速度',
      跳跃: '跳跃高度',
      攻击增伤: '对其他角色的伤害加成',
      推速: '推奶酪速度',
      墙缝增伤: '对墙缝的伤害加成',
    },
    detailed: {
      Hp上限: '健康值上限（爪刀伤害为50；Hp<0时虚弱）',
      Hp恢复: '健康状态下每秒恢复的健康值',
      移速: '移动速度（杰瑞为650；经典之家客厅长度为4680）',
      跳跃: '跳跃高度（杰瑞为400；猫均为420）',
      攻击增伤: '对其他角色的固定伤害加成',
      推速: '推奶酪速度（未计入任何推奶酪增、减速）',
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
    打架: '擅长正面对抗干扰位老鼠',
    速通: '擅长在游戏初期快速建立优势、甚至胜利',
    后期: '擅长在游戏后期逐步扩大优势',
    翻盘: '擅长捕捉鼠方失误、迅速消除劣势',
  },
  detailed: {
    进攻: '擅长击倒和放飞老鼠，通常拥有较高的伤害、控制或上火箭能力',
    防守: '擅长守奶酪/火箭/墙缝，通常拥有持续性伤害能力',
    追击: '擅长追击老鼠，通常拥有较高的机动性',
    打架: '擅长正面对抗干扰位老鼠，通常拥有霸体或减控',
    速通: '擅长在游戏初期快速建立优势、甚至胜利，通常拥有特殊的绑火箭机制',
    后期: '擅长在游戏后期逐步扩大优势，通常拥有至少两个强势满级技能',
    翻盘: '擅长捕捉鼠方失误、迅速消除劣势，通常拥有技能刷新或直接抓起老鼠的机制',
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
    奶酪: '擅长推奶酪和搬奶酪，通常拥有较高推速或瞬移技能',
    干扰: '擅长干扰猫抓老鼠或上火箭，通常拥有控制技能',
    辅助: '擅长为队友提供增益，通常拥有增益技能',
    救援: '擅长救援火箭上的队友，通常拥有霸体或无敌技能',
    破局: '擅长突破猫的防守',
    砸墙: '擅长破坏墙缝',
    后期: '擅长在游戏后期逐步扩大优势，通常有至少两个强势满级技能',
  },
};

const itemPositioningTagTooltips = {
  投掷类: '可被拾取，通过道具键瞄准和投掷的道具类别',
  手持类: '可被拾取，通过点击道具键直接使用的道具类别',
  物件类: '不可拾取，通过交互等方式进行使用的道具类别',
  食物类: '包括牛奶、蛋糕和饮料，是游戏内的常规恢复手段',
  流程类: '与游戏进程关联的道具类别',
  特殊类: '特性复杂、难以归类的特殊道具类别',
  常规道具: '包括绝大多数道具',
  衍生道具: '包括只能由其他道具进一步衍生的特殊道具',
  地图道具: '包括只能在部分地图出现的道具(不包括场景组件)',
};

const entityPositioningTagTooltips = {
  拾取物: '可直接或在特定情况下被当作道具拾取，放置于道具栏',
  投射物: '可在场景中运动，命中目标后产生效果，通常在产生效果后就消失',
  召唤物: '可存在较长时间，通过指定方式产生作用',
  NPC: '具有角色或其他NPC的外形或部分特性，且可由非玩家操纵的特殊衍生物',
  变身类: '可由玩家操作的特殊衍生物',
  平台类: '具有"平台"或"墙壁"特性的特殊衍生物',
  指示物: '不与其它物体互动，也几乎不产生效果，仅做指示用',
};

const mapPositioningTagTooltips = {
  常规地图: '在匹配等经典模式中会出现的地图',
  娱乐地图: '只在部分休闲模式中出现的地图',
  广场地图: '只在“猫鼠广场”中出现的地图',
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
  faction: FactionId,
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
  faction: FactionId,
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

export const getSpecifyTypePositioningTagTooltipContent = (
  tagName: string,
  type: 'item' | 'entity' | 'map'
): string => {
  const tooltips = {
    item: itemPositioningTagTooltips,
    entity: entityPositioningTagTooltips,
    map: mapPositioningTagTooltips,
  }[type];

  if (tooltips[tagName as keyof typeof tooltips]) {
    return tooltips[tagName as keyof typeof tooltips];
  }

  return `${tagName}`;
};

/**
 * Create tooltip content for item key cancellation mechanics
 * @param actionVerb - The action verb (e.g., "打断", "取消后摇")
 * @param isDetailed - Whether to show detailed explanation
 * @returns Tooltip content string
 */
export const getStarredItemKeyTooltipContent = (
  actionVerb: string,
  isDetailed: boolean
): string => {
  if (isDetailed) {
    return `需要【手持道具】或【所在处有道具且技能在地面原地释放】时才能${actionVerb}`;
  } else {
    return `需要手持道具`;
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
export const getAvailableProperties = (faction: FactionId): string[] => {
  return Object.keys(propertyTooltips[faction].normal);
};

/**
 * Get all available positioning tag names for tooltips
 * @param faction - Faction to get tags for
 * @returns Array of tag names
 */
export const getAvailablePositioningTags = (faction: FactionId): string[] => {
  const tooltips = faction === 'cat' ? catPositioningTagTooltips : mousePositioningTagTooltips;
  return Object.keys(tooltips.normal);
};
