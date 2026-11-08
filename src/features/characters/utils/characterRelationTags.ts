import isEqual from 'lodash-es/isEqual';
import isEqualWith from 'lodash-es/isEqualWith';

import type { CharacterRelationItem, CharacterRelationTag, TraitRelationKind } from '@/data/types';

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
