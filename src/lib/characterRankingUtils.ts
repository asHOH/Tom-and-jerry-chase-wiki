/**
 * Character ranking utilities for sorting and displaying character stats
 */

import { Character, FactionId } from '@/data/types';

export type RankableProperty =
  // Common properties
  | 'maxHp'
  | 'attackBoost'
  | 'hpRecovery'
  | 'moveSpeed'
  | 'jumpHeight'
  // Cat-specific properties
  | 'clawKnifeCdHit'
  | 'clawKnifeCdUnhit'
  | 'clawKnifeRange'
  // Mouse-specific properties
  | 'cheesePushSpeed'
  | 'wallCrackDamageBoost';

export type PropertyInfo = {
  key: RankableProperty;
  label: string;
  description: string;
  faction?: 'cat' | 'mouse'; // undefined means common to both
  unit?: string;
  higherIsBetter: boolean; // true for most stats, false for cooldowns
};

export const RANKABLE_PROPERTIES: PropertyInfo[] = [
  // Common properties
  {
    key: 'maxHp',
    label: 'HP上限',
    description: '角色的健康值上限',
    higherIsBetter: true,
  },
  {
    key: 'attackBoost',
    label: '攻击增伤',
    description: '角色的攻击力加成',
    higherIsBetter: true,
  },
  {
    key: 'hpRecovery',
    label: 'HP恢复',
    description: '角色的生命值恢复速度',
    higherIsBetter: true,
  },
  {
    key: 'moveSpeed',
    label: '移速',
    description: '角色的移动速度',
    higherIsBetter: true,
  },
  {
    key: 'jumpHeight',
    label: '跳跃',
    description: '角色的跳跃高度',
    higherIsBetter: true,
  },
  // Cat-specific properties
  {
    key: 'clawKnifeCdHit',
    label: '爪刀CD(命中)',
    description: '猫角色爪刀命中后的冷却时间',
    faction: 'cat',
    unit: 's',
    higherIsBetter: false, // Lower CD is better
  },
  {
    key: 'clawKnifeCdUnhit',
    label: '爪刀CD(未命中)',
    description: '猫角色爪刀未命中后的冷却时间',
    faction: 'cat',
    unit: 's',
    higherIsBetter: false, // Lower CD is better
  },
  {
    key: 'clawKnifeRange',
    label: '爪刀范围',
    description: '猫角色爪刀的攻击范围',
    faction: 'cat',
    higherIsBetter: true,
  },
  // Mouse-specific properties
  {
    key: 'cheesePushSpeed',
    label: '推速',
    description: '鼠角色推奶酪的速度',
    faction: 'mouse',
    unit: '%/s',
    higherIsBetter: true,
  },
  {
    key: 'wallCrackDamageBoost',
    label: '墙缝增伤',
    description: '鼠角色对墙缝的伤害加成',
    faction: 'mouse',
    higherIsBetter: true,
  },
];

export type RankedCharacter = {
  character: Character;
  rank: number;
  value: number;
  formattedValue: string;
};

/**
 * Get property info by key
 */
export function getPropertyInfo(property: RankableProperty): PropertyInfo | undefined {
  return RANKABLE_PROPERTIES.find((p) => p.key === property);
}

/**
 * Get characters that have a specific property defined
 */
export function getCharactersWithProperty(
  characters: Character[],
  property: RankableProperty,
  factionId?: FactionId
): Character[] {
  return characters
    .filter((char) => {
      const value = char[property];
      return value !== undefined && value !== null && typeof value === 'number';
    })
    .filter((char) => factionId == undefined || char.factionId == factionId);
}

/**
 * Rank characters by a specific property
 */
export function rankCharactersByProperty(
  characters: Character[],
  property: RankableProperty
): RankedCharacter[] {
  const propertyInfo = getPropertyInfo(property);
  if (!propertyInfo) {
    return [];
  }

  // Filter characters that have the property
  const charactersWithProperty = getCharactersWithProperty(characters, property);

  // Sort by property value
  const sorted = charactersWithProperty.sort((a, b) => {
    const valueA = a[property] as number;
    const valueB = b[property] as number;

    return propertyInfo.higherIsBetter
      ? valueB - valueA // Descending for higher-is-better
      : valueA - valueB; // Ascending for lower-is-better
  });

  // Assign ranks (handle ties)
  let currentRank = 1;
  const ranked: RankedCharacter[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const character = sorted[i];
    if (!character) continue;

    const value = character[property] as number;

    // Check if this character ties with the previous one
    if (i > 0) {
      const prevCharacter = sorted[i - 1];
      if (prevCharacter) {
        const prevValue = prevCharacter[property] as number;
        if (value !== prevValue) {
          currentRank = i + 1;
        }
      }
    }

    ranked.push({
      character,
      rank: currentRank,
      value,
      formattedValue: formatPropertyValue(value, propertyInfo),
    });
  }

  return ranked;
}

/**
 * Format property value for display
 */
export function formatPropertyValue(value: number, propertyInfo: PropertyInfo): string {
  const formattedNumber = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return propertyInfo.unit ? `${formattedNumber}${propertyInfo.unit}` : formattedNumber;
}

/**
 * Get properties available for a specific faction
 */
export function getPropertiesForFaction(factionId?: 'cat' | 'mouse'): PropertyInfo[] {
  if (!factionId) {
    return RANKABLE_PROPERTIES;
  }

  return RANKABLE_PROPERTIES.filter(
    (prop) => prop.faction === undefined || prop.faction === factionId
  );
}

/**
 * Get the display name for a rank position
 */
export function getRankDisplayName(rank: number): string {
  if (rank === 1) return '第1名';
  if (rank === 2) return '第2名';
  if (rank === 3) return '第3名';
  return `第${rank}名`;
}
