import type { CharacterPairRelationKind, TraitRelationKind } from '@/data/types';

export const CHARACTER_RELATION_PAIR_FIELD = 'characterRelationOverrides';

export const CHARACTER_PAIR_RELATION_KINDS = [
  'counters',
  'counteredBy',
  'counterEachOther',
  'collaborators',
] as const satisfies readonly CharacterPairRelationKind[];

export const isCharacterPairRelationKind = (
  kind: TraitRelationKind
): kind is CharacterPairRelationKind =>
  CHARACTER_PAIR_RELATION_KINDS.some((candidate) => candidate === kind);

export function getInverseCharacterRelationKind(
  kind: CharacterPairRelationKind
): CharacterPairRelationKind;
export function getInverseCharacterRelationKind(
  kind: TraitRelationKind
): CharacterPairRelationKind | null;
export function getInverseCharacterRelationKind(
  kind: TraitRelationKind
): CharacterPairRelationKind | null {
  if (kind === 'counters') return 'counteredBy';
  if (kind === 'counteredBy') return 'counters';
  if (kind === 'counterEachOther' || kind === 'collaborators') return kind;
  return null;
}

export function getCharacterRelationPairLocation(sourceId: string, targetId: string) {
  const [ownerId, otherId] = sourceId < targetId ? [sourceId, targetId] : [targetId, sourceId];
  return {
    ownerId: ownerId!,
    otherId: otherId!,
    path: `${ownerId}.${CHARACTER_RELATION_PAIR_FIELD}.${otherId}`,
  };
}

export function parseCharacterRelationPairPath(path: string) {
  const [ownerId, field, otherId, ...rest] = path.split('.');
  if (!ownerId || field !== CHARACTER_RELATION_PAIR_FIELD || !otherId) return null;
  return { ownerId, otherId, rest };
}
