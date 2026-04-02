import traits from '@/data/traits';
import type { SingleItem, Trait, TraitRelation, TraitRelationKind } from '@/data/types';

type RelationKey = string;
type RelationIndex = {
  bySubject: Map<RelationKey, TraitRelation[]>;
  byTarget: Map<RelationKey, TraitRelation[]>;
};

const relationKindOrder: TraitRelationKind[] = [
  'counters',
  'counteredBy',
  'counterEachOther',
  'collaborators',
  'countersKnowledgeCards',
  'counteredByKnowledgeCards',
  'countersSpecialSkills',
  'counteredBySpecialSkills',
  'advantageMaps',
  'advantageModes',
  'disadvantageMaps',
  'disadvantageModes',
];

const relationKindSet = new Set<TraitRelationKind>(relationKindOrder);

const relationKey = (kind: TraitRelationKind, item: SingleItem) =>
  `${kind}::${item.type}::${item.name}::${item.factionId ?? ''}`;

const normalizeTraitRelation = (trait: Trait): TraitRelation | null => {
  if (!trait.relation) return null;
  const { kind, subject, target, isMinor } = trait.relation;
  if (!relationKindSet.has(kind)) return null;
  return {
    kind,
    subject,
    target,
    ...(trait.relation.description
      ? { description: trait.relation.description }
      : trait.description
        ? { description: trait.description }
        : {}),
    ...(typeof isMinor === 'boolean' ? { isMinor } : {}),
  };
};

const buildRelationIndex = (): RelationIndex => {
  const bySubject = new Map<RelationKey, TraitRelation[]>();
  const byTarget = new Map<RelationKey, TraitRelation[]>();

  Object.values(traits).forEach((trait) => {
    const relation = normalizeTraitRelation(trait);
    if (!relation) return;

    const subjectKey = relationKey(relation.kind, relation.subject);
    const targetKey = relationKey(relation.kind, relation.target);

    const subjectList = bySubject.get(subjectKey) ?? [];
    subjectList.push(relation);
    bySubject.set(subjectKey, subjectList);

    const targetList = byTarget.get(targetKey) ?? [];
    targetList.push(relation);
    byTarget.set(targetKey, targetList);
  });

  return { bySubject, byTarget };
};

// Relation traits are treated as static runtime data, so the shared index is
// snapshotted once at module load and only rebuilt when a caller explicitly
// opts into refresh after mutating the trait source.
let relationIndex = buildRelationIndex();

const sortRelations = (relations: TraitRelation[]): TraitRelation[] => {
  const kindOrder = new Map(relationKindOrder.map((kind, index) => [kind, index]));
  return [...relations].sort((a, b) => {
    const kindDiff = (kindOrder.get(a.kind) ?? 0) - (kindOrder.get(b.kind) ?? 0);
    if (kindDiff !== 0) return kindDiff;
    if (a.isMinor === b.isMinor) return 0;
    return a.isMinor ? 1 : -1;
  });
};

export const getRelationIndex = () => relationIndex;

export const refreshRelationIndex = () => {
  relationIndex = buildRelationIndex();
  return relationIndex;
};

export const getRelationsBySubject = (kind: TraitRelationKind, subject: SingleItem) => {
  const key = relationKey(kind, subject);
  return sortRelations(relationIndex.bySubject.get(key) ?? []);
};

export const getRelationsByTarget = (kind: TraitRelationKind, target: SingleItem) => {
  const key = relationKey(kind, target);
  return sortRelations(relationIndex.byTarget.get(key) ?? []);
};

export const getRelationsByKind = (kind: TraitRelationKind) => {
  const results: TraitRelation[] = [];
  relationIndex.bySubject.forEach((relations, key) => {
    if (key.startsWith(`${kind}::`)) {
      results.push(...relations);
    }
  });
  return sortRelations(results);
};
