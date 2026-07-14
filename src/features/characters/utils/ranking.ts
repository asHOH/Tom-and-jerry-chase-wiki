/**
 * Character ranking utilities for sorting and displaying canonical role statistics.
 */

import type { DeepReadonly } from '@/types/deep-readonly';
import type { Character, FactionId } from '@/data/types';
import type { ActorProfile } from '@/features/character-roles/schema';
import { getActorJumpHeight, getActorProfile } from '@/features/character-roles/selectors';

export type RankableProperty =
  | 'maxHp'
  | 'attackBoost'
  | 'hpRecovery'
  | 'moveSpeed'
  | 'jumpHeight'
  | 'clawKnifeCdHit'
  | 'clawKnifeCdUnhit'
  | 'clawKnifeRange'
  | 'cheesePushSpeed'
  | 'wallCrackDamageBoost';

export type PropertyInfo = {
  key: RankableProperty;
  getValue: (role: ActorProfile) => number | undefined;
  formatValue: (value: number) => string;
  label: string;
  description: string;
  faction?: FactionId;
  unit?: string;
  higherIsBetter: boolean;
};

const createValueFormatter = (unit?: string) => (value: number) => {
  const formattedNumber = Number(value.toFixed(2)).toString();
  return unit ? `${formattedNumber}${unit}` : formattedNumber;
};

export const RANKABLE_PROPERTIES: readonly PropertyInfo[] = [
  {
    key: 'maxHp',
    getValue: (role) => role.maxHp,
    formatValue: createValueFormatter(),
    label: 'Hp上限',
    description: '角色的健康值上限',
    higherIsBetter: true,
  },
  {
    key: 'attackBoost',
    getValue: (role) => role.attack,
    formatValue: createValueFormatter(),
    label: '攻击增伤',
    description: '角色的攻击力加成',
    higherIsBetter: true,
  },
  {
    key: 'hpRecovery',
    getValue: (role) => role.hpRecovery,
    formatValue: createValueFormatter(),
    label: 'Hp恢复',
    description: '角色的健康值恢复速度',
    higherIsBetter: true,
  },
  {
    key: 'moveSpeed',
    getValue: (role) => role.runSpeed,
    formatValue: createValueFormatter(),
    label: '移速',
    description: '角色的移动速度',
    higherIsBetter: true,
  },
  {
    key: 'jumpHeight',
    getValue: getActorJumpHeight,
    formatValue: createValueFormatter(),
    label: '跳跃',
    description: '角色的跳跃高度',
    higherIsBetter: true,
  },
  {
    key: 'clawKnifeCdHit',
    getValue: (role) => role.attackCooldown.hit,
    formatValue: createValueFormatter('s'),
    label: '爪刀CD(命中)',
    description: '猫角色爪刀命中后的冷却时间',
    faction: 'cat',
    unit: 's',
    higherIsBetter: false,
  },
  {
    key: 'clawKnifeCdUnhit',
    getValue: (role) => role.attackCooldown.miss,
    formatValue: createValueFormatter('s'),
    label: '爪刀CD(未命中)',
    description: '猫角色爪刀未命中后的冷却时间',
    faction: 'cat',
    unit: 's',
    higherIsBetter: false,
  },
  {
    key: 'clawKnifeRange',
    getValue: (role) => role.attackRange,
    formatValue: createValueFormatter(),
    label: '爪刀范围',
    description: '猫角色爪刀的攻击范围',
    faction: 'cat',
    higherIsBetter: true,
  },
  {
    key: 'cheesePushSpeed',
    getValue: (role) => role.pushCheeseSpeed,
    formatValue: createValueFormatter('%/s'),
    label: '推速',
    description: '鼠角色推奶酪的速度',
    faction: 'mouse',
    unit: '%/s',
    higherIsBetter: true,
  },
  {
    key: 'wallCrackDamageBoost',
    getValue: (role) => role.wallDamage,
    formatValue: createValueFormatter(),
    label: '墙缝增伤',
    description: '鼠角色对墙缝的伤害加成',
    faction: 'mouse',
    higherIsBetter: true,
  },
];

export type RankedCharacter = {
  character: DeepReadonly<Character>;
  rank: number;
  value: number;
  formattedValue: string;
};

type CharacterWithRole = {
  character: DeepReadonly<Character>;
  role: ActorProfile;
};

const getRequiredFactionId = (character: DeepReadonly<Character>): FactionId => {
  if (!character.factionId) {
    throw new Error(`Character ${character.id} is missing its factionId`);
  }
  return character.factionId;
};

const joinCharacterWithRole = (character: DeepReadonly<Character>): CharacterWithRole => ({
  character,
  role: getActorProfile(character.id),
});

export function getPropertyInfo(property: RankableProperty): PropertyInfo | undefined {
  return RANKABLE_PROPERTIES.find((candidate) => candidate.key === property);
}

export function getCharactersWithProperty(
  characters: readonly DeepReadonly<Character>[],
  property: RankableProperty,
  factionId?: FactionId
): readonly DeepReadonly<Character>[] {
  const propertyInfo = getPropertyInfo(property);
  if (!propertyInfo) return [];

  return characters
    .map(joinCharacterWithRole)
    .filter(({ character }) => {
      const characterFactionId = getRequiredFactionId(character);
      return (
        (propertyInfo.faction === undefined || propertyInfo.faction === characterFactionId) &&
        (factionId === undefined || factionId === characterFactionId)
      );
    })
    .filter(({ role }) => propertyInfo.getValue(role) !== undefined)
    .map(({ character }) => character);
}

export function rankCharactersByProperty(
  characters: readonly DeepReadonly<Character>[],
  property: RankableProperty
): RankedCharacter[] {
  const propertyInfo = getPropertyInfo(property);
  if (!propertyInfo) return [];

  const sorted = characters
    .map(joinCharacterWithRole)
    .filter(({ character }) => {
      const factionId = getRequiredFactionId(character);
      return propertyInfo.faction === undefined || propertyInfo.faction === factionId;
    })
    .map(({ character, role }) => ({
      character,
      value: propertyInfo.getValue(role),
    }))
    .filter(
      (entry): entry is { character: DeepReadonly<Character>; value: number } =>
        entry.value !== undefined
    )
    .sort((a, b) => (propertyInfo.higherIsBetter ? b.value - a.value : a.value - b.value));

  let currentRank = 1;
  return sorted.map(({ character, value }, index) => {
    if (index > 0 && value !== sorted[index - 1]?.value) currentRank = index + 1;

    return {
      character,
      rank: currentRank,
      value,
      formattedValue: propertyInfo.formatValue(value),
    };
  });
}

export function getPropertiesForFaction(factionId?: FactionId): readonly PropertyInfo[] {
  if (!factionId) return RANKABLE_PROPERTIES;

  return RANKABLE_PROPERTIES.filter(
    (property) => property.faction === undefined || property.faction === factionId
  );
}

export function getRankDisplayName(rank: number): string {
  return `第${rank}名`;
}
