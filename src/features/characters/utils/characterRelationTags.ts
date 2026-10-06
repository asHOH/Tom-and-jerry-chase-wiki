import type { CharacterRelationItem, CharacterRelationTag, TraitRelationKind } from '@/data/types';

export const characterRelationTagPairs = [
  { counters: '拉扯', counteredBy: '怕拉扯' },
] as const satisfies readonly CharacterRelationTag[];

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
  if (countersKinds.has(kind)) return tags.map((tag) => tag.counters).filter(Boolean);
  if (counteredByKinds.has(kind)) return tags.map((tag) => tag.counteredBy).filter(Boolean);
  return [];
};

export const getItemCharacterRelationTagLabels = (
  item: Pick<CharacterRelationItem, 'tags'>,
  kind: TraitRelationKind
): string[] => getCharacterRelationTagLabels(item.tags, kind);
