import isEqual from 'lodash-es/isEqual';
import isEqualWith from 'lodash-es/isEqualWith';

import type {
  CharacterRelationItem,
  CharacterRelationTag,
  FactionId,
  TraitRelationKind,
} from '@/data/types';

export const characterRelationTags = [
  '拉扯',
  '机制',
  '高伤',
  '无视',
  '自保',
  '免疫',
  '稳救',
  '破局',
  '控制',
  '干扰',
  '速推',
  '辅助',
  '追击',
  '大视野',
] as const;

export type CharacterRelationTagName = (typeof characterRelationTags)[number];

const counteringFactionByTag: Record<CharacterRelationTagName, FactionId | 'both'> = {
  拉扯: 'mouse',
  机制: 'both',
  高伤: 'both',
  无视: 'both',
  自保: 'mouse',
  免疫: 'both',
  稳救: 'mouse',
  破局: 'mouse',
  控制: 'both',
  干扰: 'mouse',
  速推: 'mouse',
  辅助: 'mouse',
  追击: 'cat',
  大视野: 'both',
};

const characterRelationTagDefinitions: Record<(typeof characterRelationTags)[number], string> = {
  拉扯: '利用机动性打游击，保证奶酪进度的同时让猫咪难以找到节奏。',
  机制: '难以类比于其他克制关系的血脉克制。',
  高伤: '拥有较高的单次或爆发伤害。',
  无视: '使对手依赖的技能或策略失效。',
  自保: '难以被追上或击倒。',
  免疫: '免疫对手的伤害或控制。',
  稳救: '在猫咪防守火箭时仍能较稳定地救下队友。',
  破局: '突破对手对奶酪、火箭或墙缝的持续防守。',
  控制: '拥有单次长时间控制，通常能救下猫咪手中的队友。',
  干扰: '通过各种方式妨碍对手行动，但通常无法直接救下猫咪手中的队友。',
  速推: '善于推进奶酪进度、加快对局进程。',
  辅助: '为队友提供增益。',
  追击: '善于迅速接近老鼠。',
  大视野: '拥有更大的视野范围。',
};

export const getCharacterRelationTagDefinition = (label: string): string | undefined => {
  const name = label.startsWith('怕') ? label.slice(1) : label;
  return Object.hasOwn(characterRelationTagDefinitions, name)
    ? characterRelationTagDefinitions[name as keyof typeof characterRelationTagDefinitions]
    : undefined;
};

// Only these character traits generate suggested relations automatically.
export const inferredCharacterRelationTags = ['拉扯'] as const;

export const getCharacterRelationTagName = (tag: CharacterRelationTag): string =>
  typeof tag === 'string' ? tag : tag.counters;

export const normalizeCharacterRelationTags = (
  tags: readonly CharacterRelationTag[] | undefined
): string[] => (tags ?? []).map((tag) => getCharacterRelationTagName(tag).trim()).filter(Boolean);

// Compare projected relations across formats without rewriting action before-values.
export const areCharacterRelationItemsEqual = (left: unknown, right: unknown): boolean =>
  isEqualWith(left, right, (a, b, key) => {
    if (key !== 'tags') return undefined;
    return isEqualWith(a, b, (tag, other) => {
      if (typeof tag === 'string' && typeof other !== 'string')
        return isEqual(other, { counters: tag, counteredBy: `怕${tag}` });
      if (typeof other === 'string' && typeof tag !== 'string')
        return isEqual(tag, { counters: other, counteredBy: `怕${other}` });
      return undefined;
    });
  });

const countersKinds = new Set<TraitRelationKind>([
  'counters',
  'countersKnowledgeCards',
  'countersSpecialSkills',
]);

const counteredByKinds = new Set<TraitRelationKind>([
  'counteredBy',
  'counteredByKnowledgeCards',
  'counteredBySpecialSkills',
]);

export const supportsCharacterRelationTags = (kind: TraitRelationKind): boolean =>
  countersKinds.has(kind) || counteredByKinds.has(kind);

// Counter relations (including cards and skills) connect opposite factions.
export const getAllowedCharacterRelationTags = (
  subjectFaction: FactionId | undefined,
  kind: TraitRelationKind
): readonly string[] => {
  if (!subjectFaction || !supportsCharacterRelationTags(kind)) return [];
  const counteringFaction = countersKinds.has(kind)
    ? subjectFaction
    : subjectFaction === 'cat'
      ? 'mouse'
      : 'cat';
  return characterRelationTags.filter(
    (tag) =>
      counteringFactionByTag[tag] === 'both' || counteringFactionByTag[tag] === counteringFaction
  );
};

export const getAllowedInferredCharacterRelationTags = (faction: FactionId): string[] =>
  inferredCharacterRelationTags.flatMap((tag) => [
    ...(getAllowedCharacterRelationTags(faction, 'counters').includes(tag) ? [tag] : []),
    ...(getAllowedCharacterRelationTags(faction, 'counteredBy').includes(tag) ? [`怕${tag}`] : []),
  ]);

export const getCharacterRelationTagLabels = (
  tags: readonly CharacterRelationTag[] | undefined,
  kind: TraitRelationKind
): string[] => {
  if (!tags) return [];
  if (countersKinds.has(kind)) return tags.map(getCharacterRelationTagName).filter(Boolean);
  if (counteredByKinds.has(kind))
    return tags
      .map((tag) => (typeof tag === 'string' ? (tag ? `怕${tag}` : '') : tag.counteredBy))
      .filter(Boolean);
  return [];
};

export const getItemCharacterRelationTagLabels = (
  item: Pick<CharacterRelationItem, 'tags'>,
  kind: TraitRelationKind
): string[] => getCharacterRelationTagLabels(item.tags, kind);
