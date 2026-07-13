import type { DeepReadonly } from '@/types/deep-readonly';
import type { Character, FactionId } from '@/data/types';

import type { CharacterRole } from './schema';
import { getCharacterRole, getCharacterRoleJumpHeight } from './selectors';

type ParityValue = number | string | null;

type ParityField =
  | 'maxHp'
  | 'attackBoost'
  | 'hpRecovery'
  | 'moveSpeed'
  | 'clawKnifeCdHit'
  | 'clawKnifeCdUnhit'
  | 'clawKnifeRange'
  | 'initialItem'
  | 'storePurchaseTime'
  | 'cheesePushSpeed'
  | 'wallCrackDamageBoost'
  | 'gender';

type ParityFieldDescriptor = {
  field: ParityField;
  faction?: FactionId;
  getLegacyValue: (character: DeepReadonly<Character>) => string | number | undefined;
  getCanonicalValue: (role: CharacterRole) => string | number | undefined;
};

export type CharacterRoleParityDifference = {
  characterId: string;
  field: ParityField;
  legacyValue: ParityValue;
  canonicalValue: ParityValue;
  reason?: string;
};

export type CharacterRoleJumpHeightParity = {
  characterId: string;
  legacyValue: number | null;
  canonicalValue: number;
  changed: boolean;
};

export type CharacterRoleParityReport = {
  summary: {
    playableCharacterCount: number;
    coveredFieldCount: number;
    reviewedCorrectionCount: number;
    unexplainedDifferenceCount: number;
    jumpHeightChangeCount: number;
  };
  reviewedCorrections: readonly CharacterRoleParityDifference[];
  unexplainedDifferences: readonly CharacterRoleParityDifference[];
  jumpHeights: readonly CharacterRoleJumpHeightParity[];
};

const JSON_AUTHORITY_REASON = 'Reviewed correction: the new JSON data is authoritative.';

const APPROVED_CORRECTIONS = new Set([
  '莱特宁:moveSpeed',
  '侍卫汤姆:moveSpeed',
  '米特:hpRecovery',
  '剑客汤姆:clawKnifeCdUnhit',
  '苏蕊:clawKnifeCdUnhit',
  '天使汤姆:hpRecovery',
  '天使汤姆:moveSpeed',
  '斯飞:maxHp',
  '斯飞:clawKnifeCdUnhit',
  '恶魔汤姆:hpRecovery',
  '恶魔汤姆:moveSpeed',
  '如玉:clawKnifeCdUnhit',
  '侦探汤姆:maxHp',
  '侦探汤姆:hpRecovery',
  '侦探汤姆:moveSpeed',
  '侦探汤姆:clawKnifeCdHit',
  '侦探汤姆:clawKnifeCdUnhit',
  '侦探汤姆:clawKnifeRange',
  '仙女鼠:moveSpeed',
  '莱恩:moveSpeed',
  '汤姆:storePurchaseTime',
  '布奇:storePurchaseTime',
  '托普斯:storePurchaseTime',
  '莱特宁:storePurchaseTime',
  '牛仔汤姆:storePurchaseTime',
  '图多盖洛:storePurchaseTime',
  '侍卫汤姆:storePurchaseTime',
  '图茨:storePurchaseTime',
  '米特:storePurchaseTime',
  '塔拉:storePurchaseTime',
  '剑客汤姆:storePurchaseTime',
  '库博:storePurchaseTime',
  '凯特:storePurchaseTime',
  '苏蕊:storePurchaseTime',
  '天使汤姆:storePurchaseTime',
  '斯飞:storePurchaseTime',
  '恶魔汤姆:storePurchaseTime',
  '兔八哥:storePurchaseTime',
  '追风汤姆:storePurchaseTime',
  '如玉:storePurchaseTime',
  '侦探汤姆:storePurchaseTime',
]);

const normalizeValue = (value: string | number | undefined): ParityValue => value ?? null;

const normalizeLegacyInitialItem = (character: DeepReadonly<Character>): string =>
  character.initialItem ?? '老鼠夹';

const normalizeCanonicalGender = (role: CharacterRole): 'male' | 'female' | undefined =>
  role.sex === 'none' ? undefined : role.sex;

const PARITY_FIELDS: readonly ParityFieldDescriptor[] = [
  {
    field: 'maxHp',
    getLegacyValue: (character) => character.maxHp,
    getCanonicalValue: (role) => role.maxHp,
  },
  {
    field: 'attackBoost',
    faction: 'cat',
    getLegacyValue: (character) => character.attackBoost,
    getCanonicalValue: (role) => role.attack,
  },
  {
    field: 'hpRecovery',
    getLegacyValue: (character) => character.hpRecovery,
    getCanonicalValue: (role) => role.hpRecovery,
  },
  {
    field: 'moveSpeed',
    getLegacyValue: (character) => character.moveSpeed,
    getCanonicalValue: (role) => role.runSpeed,
  },
  {
    field: 'clawKnifeCdHit',
    faction: 'cat',
    getLegacyValue: (character) => character.clawKnifeCdHit,
    getCanonicalValue: (role) => role.attackCooldown.hit,
  },
  {
    field: 'clawKnifeCdUnhit',
    faction: 'cat',
    getLegacyValue: (character) => character.clawKnifeCdUnhit,
    getCanonicalValue: (role) => role.attackCooldown.miss,
  },
  {
    field: 'clawKnifeRange',
    faction: 'cat',
    getLegacyValue: (character) => character.clawKnifeRange,
    getCanonicalValue: (role) => role.attackRange,
  },
  {
    field: 'initialItem',
    faction: 'cat',
    getLegacyValue: normalizeLegacyInitialItem,
    getCanonicalValue: (role) => role.initialItem,
  },
  {
    field: 'storePurchaseTime',
    faction: 'cat',
    getLegacyValue: (character) => character.storePurchaseTime,
    getCanonicalValue: (role) => role.shoppingDelay,
  },
  {
    field: 'cheesePushSpeed',
    faction: 'mouse',
    getLegacyValue: (character) => character.cheesePushSpeed,
    getCanonicalValue: (role) => role.pushCheeseSpeed,
  },
  {
    field: 'wallCrackDamageBoost',
    faction: 'mouse',
    getLegacyValue: (character) => character.wallCrackDamageBoost,
    getCanonicalValue: (role) => role.wallDamage,
  },
  {
    field: 'gender',
    getLegacyValue: (character) => character.gender,
    getCanonicalValue: normalizeCanonicalGender,
  },
];

const getRequiredFactionId = (character: DeepReadonly<Character>): FactionId => {
  if (!character.factionId) {
    throw new Error(`Character ${character.id} is missing its factionId`);
  }
  return character.factionId;
};

export const createCharacterRoleParityReport = (
  characters: readonly DeepReadonly<Character>[]
): CharacterRoleParityReport => {
  const reviewedCorrections: CharacterRoleParityDifference[] = [];
  const unexplainedDifferences: CharacterRoleParityDifference[] = [];
  const jumpHeights: CharacterRoleJumpHeightParity[] = [];
  const encounteredApprovedCorrections = new Set<string>();

  for (const character of characters) {
    const factionId = getRequiredFactionId(character);
    const role = getCharacterRole(character.id);

    for (const descriptor of PARITY_FIELDS) {
      if (descriptor.faction !== undefined && descriptor.faction !== factionId) continue;

      const legacyValue = normalizeValue(descriptor.getLegacyValue(character));
      const canonicalValue = normalizeValue(descriptor.getCanonicalValue(role));
      if (Object.is(legacyValue, canonicalValue)) continue;

      const differenceKey = `${character.id}:${descriptor.field}`;
      const difference: CharacterRoleParityDifference = {
        characterId: character.id,
        field: descriptor.field,
        legacyValue,
        canonicalValue,
      };

      if (APPROVED_CORRECTIONS.has(differenceKey)) {
        encounteredApprovedCorrections.add(differenceKey);
        reviewedCorrections.push({ ...difference, reason: JSON_AUTHORITY_REASON });
      } else {
        unexplainedDifferences.push(difference);
      }
    }

    const legacyJumpHeight = character.jumpHeight ?? null;
    const canonicalJumpHeight = getCharacterRoleJumpHeight(role);
    jumpHeights.push({
      characterId: character.id,
      legacyValue: legacyJumpHeight,
      canonicalValue: canonicalJumpHeight,
      changed: legacyJumpHeight !== canonicalJumpHeight,
    });
  }

  const staleCorrections = [...APPROVED_CORRECTIONS].filter(
    (key) => !encounteredApprovedCorrections.has(key)
  );
  if (staleCorrections.length > 0) {
    throw new Error(`Stale character-role parity corrections: ${staleCorrections.join(', ')}`);
  }

  return {
    summary: {
      playableCharacterCount: characters.length,
      coveredFieldCount: PARITY_FIELDS.length,
      reviewedCorrectionCount: reviewedCorrections.length,
      unexplainedDifferenceCount: unexplainedDifferences.length,
      jumpHeightChangeCount: jumpHeights.filter(({ changed }) => changed).length,
    },
    reviewedCorrections,
    unexplainedDifferences,
    jumpHeights,
  };
};
