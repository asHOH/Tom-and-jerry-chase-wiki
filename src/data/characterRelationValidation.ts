import type { SingleItem, Trait, TraitRelation, TraitRelationKind } from './types';

const contradictoryCharacterRelationKinds: ReadonlyArray<
  readonly [TraitRelationKind, TraitRelationKind]
> = [
  ['counters', 'counteredBy'],
  ['counters', 'counterEachOther'],
  ['counteredBy', 'counterEachOther'],
];

const symmetricCharacterRelationKinds = new Set<TraitRelationKind>([
  'collaborators',
  'counterEachOther',
]);

const toSingleItemKey = (item: SingleItem) => `${item.type}:${item.name}:${item.factionId ?? ''}`;

export const buildCharacterRelationEdgeKey = (relation: TraitRelation) =>
  `${relation.kind}::${toSingleItemKey(relation.subject)}::${toSingleItemKey(relation.target)}`;

const buildDirectedPairKey = (relation: TraitRelation) =>
  `${toSingleItemKey(relation.subject)}::${toSingleItemKey(relation.target)}`;

const isCharacterPairRelation = (relation: TraitRelation) =>
  relation.subject.type === 'character' && relation.target.type === 'character';

const buildSemanticCharacterRelationKey = (relation: TraitRelation) => {
  if (!isCharacterPairRelation(relation)) return null;

  if (relation.kind === 'counters' || relation.kind === 'counteredBy') {
    const canonicalSubject = relation.kind === 'counters' ? relation.subject : relation.target;
    const canonicalTarget = relation.kind === 'counters' ? relation.target : relation.subject;

    return `counters::${toSingleItemKey(canonicalSubject)}::${toSingleItemKey(canonicalTarget)}`;
  }

  if (symmetricCharacterRelationKinds.has(relation.kind)) {
    const pair = [toSingleItemKey(relation.subject), toSingleItemKey(relation.target)].sort();
    return `${relation.kind}::${pair[0]}::${pair[1]}`;
  }

  return null;
};

export const findCharacterRelationValidationErrors = (traits: Trait[]): string[] => {
  const errors: string[] = [];
  const seenEdges = new Map<string, number>();
  const seenSemanticCharacterEdges = new Map<string, { index: number; relation: TraitRelation }>();
  const kindsByPair = new Map<string, Map<TraitRelationKind, number[]>>();

  traits.forEach((trait, index) => {
    const relation = trait.relation;
    if (!relation) return;

    const edgeKey = buildCharacterRelationEdgeKey(relation);
    const existingIndex = seenEdges.get(edgeKey);
    if (existingIndex !== undefined) {
      errors.push(
        `Duplicate relation edge ${edgeKey} at entries #${existingIndex + 1} and #${index + 1}.`
      );
    } else {
      seenEdges.set(edgeKey, index);
    }

    const semanticCharacterEdgeKey = buildSemanticCharacterRelationKey(relation);
    if (semanticCharacterEdgeKey) {
      const existingSemanticEdge = seenSemanticCharacterEdges.get(semanticCharacterEdgeKey);

      if (existingSemanticEdge) {
        errors.push(
          `Semantic duplicate character relation ${semanticCharacterEdgeKey} at entries #${
            existingSemanticEdge.index + 1
          } and #${index + 1} (${existingSemanticEdge.relation.kind} mirrors ${relation.kind}).`
        );
      } else {
        seenSemanticCharacterEdges.set(semanticCharacterEdgeKey, { index, relation });
      }
    }

    if (!isCharacterPairRelation(relation)) return;

    const pairKey = buildDirectedPairKey(relation);
    const existingKinds = kindsByPair.get(pairKey) ?? new Map<TraitRelationKind, number[]>();
    const existingEntries = existingKinds.get(relation.kind) ?? [];
    existingEntries.push(index);
    existingKinds.set(relation.kind, existingEntries);
    kindsByPair.set(pairKey, existingKinds);
  });

  kindsByPair.forEach((kinds, pairKey) => {
    contradictoryCharacterRelationKinds.forEach(([leftKind, rightKind]) => {
      const leftEntries = kinds.get(leftKind);
      const rightEntries = kinds.get(rightKind);

      if (!leftEntries?.length || !rightEntries?.length) return;

      errors.push(
        `Contradictory character relation kinds for ${pairKey}: ${leftKind} at entries #${leftEntries
          .map((entry) => entry + 1)
          .join(', ')} conflicts with ${rightKind} at entries #${rightEntries
          .map((entry) => entry + 1)
          .join(', ')}.`
      );
    });
  });

  return errors;
};

export const assertValidCharacterRelations = (traits: Trait[]) => {
  const errors = findCharacterRelationValidationErrors(traits);
  if (errors.length === 0) return;

  throw new Error(
    `Invalid character relation data:\n${errors.map((error) => `- ${error}`).join('\n')}`
  );
};
