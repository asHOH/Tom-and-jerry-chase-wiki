import type { FactionId } from '@/data/types';
import type { ActorProfile } from '@/features/character-roles/schema';
import { getCharacterRole, getCharacterRoleJumpHeight } from '@/features/character-roles/selectors';

export type CharacterGameStatKey =
  | 'maxHp'
  | 'attackBoost'
  | 'moveSpeed'
  | 'jumpHeight'
  | 'clawKnifeCdHit'
  | 'cheesePushSpeed'
  | 'wallCrackDamageBoost';

export type CharacterGameStatInfo = {
  key: CharacterGameStatKey;
  label: string;
  faction?: FactionId;
  higherIsBetter: boolean;
  getValue: (role: ActorProfile) => number | undefined;
};

export type CharacterGameStats = Readonly<Record<CharacterGameStatKey, number | undefined>>;

type PlayableCharacterReference = {
  id: string;
  factionId: FactionId;
};

export const CHARACTER_GAME_STAT_INFO: Readonly<
  Record<CharacterGameStatKey, CharacterGameStatInfo>
> = {
  maxHp: {
    key: 'maxHp',
    label: '最大血量',
    higherIsBetter: true,
    getValue: (role) => role.maxHp,
  },
  attackBoost: {
    key: 'attackBoost',
    label: '攻击增伤 (%)',
    higherIsBetter: true,
    getValue: (role) => role.attack,
  },
  moveSpeed: {
    key: 'moveSpeed',
    label: '移动速度',
    higherIsBetter: true,
    getValue: (role) => role.runSpeed,
  },
  jumpHeight: {
    key: 'jumpHeight',
    label: '跳跃高度',
    higherIsBetter: true,
    getValue: getCharacterRoleJumpHeight,
  },
  clawKnifeCdHit: {
    key: 'clawKnifeCdHit',
    label: '爪刀CD (命中)',
    faction: 'cat',
    higherIsBetter: false,
    getValue: (role) => role.attackCooldown.hit,
  },
  cheesePushSpeed: {
    key: 'cheesePushSpeed',
    label: '推奶酪速度',
    faction: 'mouse',
    higherIsBetter: true,
    getValue: (role) => role.pushCheeseSpeed,
  },
  wallCrackDamageBoost: {
    key: 'wallCrackDamageBoost',
    label: '砸墙破坏力',
    faction: 'mouse',
    higherIsBetter: true,
    getValue: (role) => role.wallDamage,
  },
};

const getApplicableValue = (
  role: ActorProfile,
  factionId: FactionId,
  stat: CharacterGameStatInfo
): number | undefined => {
  if (stat.faction !== undefined && stat.faction !== factionId) return undefined;
  return stat.getValue(role);
};

export const getCharacterGameStats = ({
  id,
  factionId,
}: PlayableCharacterReference): CharacterGameStats => {
  const role = getCharacterRole(id);
  return {
    maxHp: getApplicableValue(role, factionId, CHARACTER_GAME_STAT_INFO.maxHp),
    attackBoost: getApplicableValue(role, factionId, CHARACTER_GAME_STAT_INFO.attackBoost),
    moveSpeed: getApplicableValue(role, factionId, CHARACTER_GAME_STAT_INFO.moveSpeed),
    jumpHeight: getApplicableValue(role, factionId, CHARACTER_GAME_STAT_INFO.jumpHeight),
    clawKnifeCdHit: getApplicableValue(role, factionId, CHARACTER_GAME_STAT_INFO.clawKnifeCdHit),
    cheesePushSpeed: getApplicableValue(role, factionId, CHARACTER_GAME_STAT_INFO.cheesePushSpeed),
    wallCrackDamageBoost: getApplicableValue(
      role,
      factionId,
      CHARACTER_GAME_STAT_INFO.wallCrackDamageBoost
    ),
  };
};

export const compareCharacterGameStatValues = (
  leftValue: number,
  rightValue: number,
  statName: CharacterGameStatKey
): 'left' | 'right' | 'tie' => {
  if (leftValue === rightValue) return 'tie';

  const { higherIsBetter } = CHARACTER_GAME_STAT_INFO[statName];
  if (higherIsBetter) return leftValue > rightValue ? 'left' : 'right';
  return leftValue < rightValue ? 'left' : 'right';
};
