/**
 * Character ranking utilities for sorting and displaying canonical actor profile statistics.
 */

import type { DeepReadonly } from '@/types/deep-readonly';
import type { Character, FactionId } from '@/data/types';
import type { ActorProfile } from '@/features/actor-profiles/schema';
import { getActorJumpHeight, getActorProfile } from '@/features/actor-profiles/selectors';

export type RankableProperty =
  | 'maxHp'
  | 'attackBoost'
  | 'hpRecovery'
  | 'moveSpeed'
  | 'jumpHeight'
  | 'jumpSpeed'
  | 'climbSpeed'
  | 'visionScale'
  | 'gravity'
  | 'clawKnifeCdHit'
  | 'clawKnifeCdUnhit'
  | 'clawKnifeRange'
  | 'cheesePushSpeed'
  | 'wallCrackDamageBoost'
  | 'deformCooldown'
  | 'shoppingDelay';

export type PropertyInfo = {
  key: RankableProperty;
  getValue: (profile: ActorProfile) => number | undefined;
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
    getValue: (profile) => profile.maxHp,
    formatValue: createValueFormatter(),
    label: 'Hp上限',
    description: '角色的健康值上限',
    higherIsBetter: true,
  },
  {
    key: 'attackBoost',
    getValue: (profile) => profile.attack,
    formatValue: createValueFormatter(),
    label: '攻击增伤',
    description: '角色的攻击力加成',
    higherIsBetter: true,
  },
  {
    key: 'hpRecovery',
    getValue: (profile) => profile.hpRecovery,
    formatValue: createValueFormatter(),
    label: 'Hp恢复',
    description: '角色的健康值恢复速度',
    higherIsBetter: true,
  },
  {
    key: 'moveSpeed',
    getValue: (profile) => profile.runSpeed,
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
    key: 'jumpSpeed',
    getValue: (profile) => profile.jumpSpeed,
    formatValue: createValueFormatter('/s'),
    label: '跳跃速度',
    description: '角色跳跃时的初速度',
    unit: '/s',
    higherIsBetter: true,
  },
  {
    key: 'climbSpeed',
    getValue: (profile) => profile.climbSpeed,
    formatValue: createValueFormatter('/s'),
    label: '攀爬速度',
    description: '角色持续交互攀爬梯子的速度',
    unit: '/s',
    higherIsBetter: true,
  },
  {
    key: 'visionScale',
    getValue: (profile) => profile.visionScale,
    formatValue: createValueFormatter(),
    label: '视野缩放',
    description: '角色的视野缩放倍率，数值越小实际视野越大',
    higherIsBetter: false,
  },
  {
    key: 'gravity',
    getValue: (profile) => profile.gravity,
    formatValue: createValueFormatter(),
    label: '重力参数',
    description: '角色受到的重力加速度',
    higherIsBetter: true,
  },
  {
    key: 'clawKnifeCdHit',
    getValue: (profile) => profile.attackCooldown.hit,
    formatValue: createValueFormatter('s'),
    label: '爪刀CD(命中)',
    description: '猫角色爪刀命中后的冷却时间',
    faction: 'cat',
    unit: 's',
    higherIsBetter: false,
  },
  {
    key: 'clawKnifeCdUnhit',
    getValue: (profile) => profile.attackCooldown.miss,
    formatValue: createValueFormatter('s'),
    label: '爪刀CD(未命中)',
    description: '猫角色爪刀未命中后的冷却时间',
    faction: 'cat',
    unit: 's',
    higherIsBetter: false,
  },
  {
    key: 'clawKnifeRange',
    getValue: (profile) => profile.attackRange,
    formatValue: createValueFormatter(),
    label: '爪刀范围',
    description: '猫角色爪刀的攻击范围',
    faction: 'cat',
    higherIsBetter: true,
  },
  {
    key: 'cheesePushSpeed',
    getValue: (profile) => profile.pushCheeseSpeed,
    formatValue: createValueFormatter('%/s'),
    label: '推速',
    description: '鼠角色推奶酪的速度',
    faction: 'mouse',
    unit: '%/s',
    higherIsBetter: true,
  },
  {
    key: 'wallCrackDamageBoost',
    getValue: (profile) => profile.wallDamage,
    formatValue: createValueFormatter(),
    label: '墙缝增伤',
    description: '鼠角色对墙缝的伤害加成',
    faction: 'mouse',
    higherIsBetter: true,
  },
  {
    key: 'deformCooldown',
    getValue: (profile) => profile.deformCooldown,
    formatValue: createValueFormatter('s'),
    label: '变形彩蛋CD',
    description: '部分角色特殊变形彩蛋的触发冷却时间',
    unit: 's',
    higherIsBetter: false,
  },
  {
    key: 'shoppingDelay',
    getValue: (profile) => profile.shoppingDelay,
    formatValue: createValueFormatter('s'),
    label: '购物到货时间',
    description: '猫角色开始购物至到货所需的时间',
    faction: 'cat',
    unit: 's',
    higherIsBetter: false,
  },
];

export type RankedCharacter = {
  character: DeepReadonly<Character>;
  rank: number;
  value: number;
  formattedValue: string;
};

type CharacterWithActorProfile = {
  character: DeepReadonly<Character>;
  actorProfile: ActorProfile;
};

const getRequiredFactionId = (character: DeepReadonly<Character>): FactionId => {
  if (!character.factionId) {
    throw new Error(`Character ${character.id} is missing its factionId`);
  }
  return character.factionId;
};

const joinCharacterWithActorProfile = (
  character: DeepReadonly<Character>
): CharacterWithActorProfile => ({
  character,
  actorProfile: getActorProfile(character.id),
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
    .map(joinCharacterWithActorProfile)
    .filter(({ character }) => {
      const characterFactionId = getRequiredFactionId(character);
      return (
        (propertyInfo.faction === undefined || propertyInfo.faction === characterFactionId) &&
        (factionId === undefined || factionId === characterFactionId)
      );
    })
    .filter(({ actorProfile }) => propertyInfo.getValue(actorProfile) !== undefined)
    .map(({ character }) => character);
}

export function rankCharactersByProperty(
  characters: readonly DeepReadonly<Character>[],
  property: RankableProperty
): RankedCharacter[] {
  const propertyInfo = getPropertyInfo(property);
  if (!propertyInfo) return [];

  const sorted = characters
    .map(joinCharacterWithActorProfile)
    .filter(({ character }) => {
      const factionId = getRequiredFactionId(character);
      return propertyInfo.faction === undefined || propertyInfo.faction === factionId;
    })
    .map(({ character, actorProfile }) => ({
      character,
      value: propertyInfo.getValue(actorProfile),
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
