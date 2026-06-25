import type { DeepReadonly } from '@/types/deep-readonly';
import type { CharacterWithFaction } from '@/lib/types';
import type {
  CharacterRelation,
  CharacterRelationItem,
  SingleItem,
  TraitRelation,
} from '@/data/types';
import {
  getRelationsByKind,
  getRelationsBySubject,
  getRelationsByTarget,
} from '@/features/shared/traits/relationIndex';

const defaultRelation: CharacterRelation = {
  counters: [],
  counteredBy: [],
  counterEachOther: [],
  collaborators: [],
  countersKnowledgeCards: [],
  counteredByKnowledgeCards: [],
  countersSpecialSkills: [],
  counteredBySpecialSkills: [],
  advantageMaps: [],
  advantageModes: [],
  disadvantageMaps: [],
  disadvantageModes: [],
};

const relationKeys = Object.keys(defaultRelation) as Array<keyof CharacterRelation>;

const toRelationItem = (
  relation: TraitRelation,
  useTarget: boolean,
  targetOverride?: string
): CharacterRelationItem => {
  const targetName = targetOverride ?? (useTarget ? relation.target.name : relation.subject.name);
  return {
    id: targetName,
    ...(relation.description ? { description: relation.description } : {}),
    isMinor: relation.isMinor ?? false,
  };
};

const mergeRelationItems = (
  primary: CharacterRelationItem[],
  secondary: CharacterRelationItem[]
) => {
  return [...primary, ...secondary.filter((item) => !primary.some((p) => p.id === item.id))];
};

const normalizeLegacyItems = (
  items: CharacterRelationItem[] | undefined
): CharacterRelationItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: item.id,
    description: item.description ?? '',
    isMinor: !!item.isMinor,
  }));
};

const createEmptyRelation = (): CharacterRelation =>
  relationKeys.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as CharacterRelation);

type LegacyOverlayProjection = {
  relations: CharacterRelation;
  ownedRelationKinds: ReadonlySet<keyof CharacterRelation>;
};

const buildLegacyOverlayRelations = (
  charactersRecord: DeepReadonly<Record<string, CharacterWithFaction>>,
  id: string
): LegacyOverlayProjection => {
  const legacy = createEmptyRelation();
  const ownedRelationKinds = new Set<keyof CharacterRelation>();
  const current = charactersRecord[id] as Partial<CharacterRelation> | undefined;

  if (current) {
    relationKeys.forEach((key) => {
      const stored = current[key];
      if (Array.isArray(stored)) {
        ownedRelationKinds.add(key);
        legacy[key] = normalizeLegacyItems(stored);
      }
    });
  }

  const addInverse = (
    source: CharacterRelationItem[] | undefined,
    targetKey: keyof CharacterRelation,
    otherId: string
  ) => {
    if (!Array.isArray(source)) return;
    const matches = source.filter((item) => item.id === id);
    if (matches.length === 0) return;
    const inverseItems = matches.map((item) => ({
      id: otherId,
      description: item.description ?? '',
      isMinor: !!item.isMinor,
    }));
    legacy[targetKey] = mergeRelationItems(legacy[targetKey], inverseItems);
  };

  Object.entries(charactersRecord).forEach(([otherId, other]) => {
    if (otherId === id) return;
    const otherLegacy = other as Partial<CharacterRelation>;
    addInverse(otherLegacy.counters, 'counteredBy', otherId);
    addInverse(otherLegacy.counteredBy, 'counters', otherId);
    addInverse(otherLegacy.counterEachOther, 'counterEachOther', otherId);
    addInverse(otherLegacy.collaborators, 'collaborators', otherId);
  });

  return { relations: legacy, ownedRelationKinds };
};

const buildSharedTraitRelations = (id: string): CharacterRelation => {
  const subject: SingleItem = { name: id, type: 'character' };
  const counters = getRelationsBySubject('counters', subject).map((relation) =>
    toRelationItem(relation, true)
  );
  const counteredBy = getRelationsBySubject('counteredBy', subject).map((relation) =>
    toRelationItem(relation, true)
  );
  const counterEachOther = getRelationsBySubject('counterEachOther', subject).map((relation) =>
    toRelationItem(relation, true)
  );
  const collaborators = getRelationsBySubject('collaborators', subject).map((relation) =>
    toRelationItem(relation, true)
  );

  const countersKnowledgeCards = getRelationsBySubject('countersKnowledgeCards', subject).map(
    (relation) => toRelationItem(relation, true)
  );
  const counteredByKnowledgeCards = getRelationsBySubject('counteredByKnowledgeCards', subject).map(
    (relation) => toRelationItem(relation, true)
  );
  const countersSpecialSkills = getRelationsBySubject('countersSpecialSkills', subject).map(
    (relation) => toRelationItem(relation, true)
  );
  const counteredBySpecialSkills = getRelationsBySubject('counteredBySpecialSkills', subject).map(
    (relation) => toRelationItem(relation, true)
  );

  const advantageMaps = getRelationsBySubject('advantageMaps', subject).map((relation) =>
    toRelationItem(relation, true)
  );
  const advantageModes = getRelationsBySubject('advantageModes', subject).map((relation) =>
    toRelationItem(relation, true)
  );
  const disadvantageMaps = getRelationsBySubject('disadvantageMaps', subject).map((relation) =>
    toRelationItem(relation, true)
  );
  const disadvantageModes = getRelationsBySubject('disadvantageModes', subject).map((relation) =>
    toRelationItem(relation, true)
  );

  return {
    counters,
    countersKnowledgeCards,
    countersSpecialSkills,
    counteredBy,
    counteredByKnowledgeCards,
    counteredBySpecialSkills,
    counterEachOther,
    collaborators,
    advantageMaps,
    advantageModes,
    disadvantageMaps,
    disadvantageModes,
  };
};

const buildSharedInverseCharacterRelations = (id: string) => {
  const target: SingleItem = { name: id, type: 'character' };

  return {
    collaborators: getRelationsByTarget('collaborators', target).map((relation) =>
      toRelationItem(relation, false)
    ),
    counterEachOther: getRelationsByTarget('counterEachOther', target).map((relation) =>
      toRelationItem(relation, false)
    ),
    counteredBy: getRelationsByTarget('counters', target).map((relation) =>
      toRelationItem(relation, false)
    ),
    counters: getRelationsByTarget('counteredBy', target).map((relation) =>
      toRelationItem(relation, false)
    ),
  };
};

const mergeCharacterRelationProjection = (
  sharedTraitRelations: CharacterRelation,
  sharedInverseCharacterRelations: Pick<
    CharacterRelation,
    'collaborators' | 'counterEachOther' | 'counteredBy' | 'counters'
  >,
  legacyOverlayProjection: LegacyOverlayProjection
): CharacterRelation => {
  const merged = {
    ...sharedTraitRelations,
    collaborators: mergeRelationItems(
      sharedTraitRelations.collaborators,
      sharedInverseCharacterRelations.collaborators
    ),
    counterEachOther: mergeRelationItems(
      sharedTraitRelations.counterEachOther,
      sharedInverseCharacterRelations.counterEachOther
    ),
    counteredBy: mergeRelationItems(
      sharedTraitRelations.counteredBy,
      sharedInverseCharacterRelations.counteredBy
    ),
    counters: mergeRelationItems(
      sharedTraitRelations.counters,
      sharedInverseCharacterRelations.counters
    ),
  };

  relationKeys.forEach((key) => {
    const legacyItems = legacyOverlayProjection.relations[key];
    if (legacyOverlayProjection.ownedRelationKinds.has(key)) {
      merged[key] = legacyItems;
      return;
    }

    if (legacyItems.length > 0) {
      merged[key] = mergeRelationItems(legacyItems, merged[key]);
    }
  });

  return merged;
};

// The character detail page reads a hybrid projection: shared relation traits,
// inverse shared character links, and page-local legacy overlay arrays.
export function getCharacterRelation(
  charactersRecord: DeepReadonly<Record<string, CharacterWithFaction>>,
  id: string
): CharacterRelation {
  if (!charactersRecord[id]) return defaultRelation;

  return mergeCharacterRelationProjection(
    buildSharedTraitRelations(id),
    buildSharedInverseCharacterRelations(id),
    buildLegacyOverlayRelations(charactersRecord, id)
  );
}

export const getSpecialSkillRelationSummary = (
  charactersRecord: DeepReadonly<Record<string, CharacterWithFaction>>,
  skillName: string,
  factionId: SingleItem['factionId']
) => {
  const target: SingleItem = {
    name: skillName,
    type: 'specialSkill',
    ...(factionId ? { factionId } : {}),
  };
  const counters = getRelationsByTarget('countersSpecialSkills', target);
  const counteredBy = getRelationsByTarget('counteredBySpecialSkills', target);

  const filteredCounters = counters.filter(
    (relation) => relation.subject.name !== skillName && relation.subject.type === 'character'
  );
  const filteredCounteredBy = counteredBy.filter(
    (relation) => relation.subject.name !== skillName && relation.subject.type === 'character'
  );

  const byMinor = (relations: TraitRelation[]) => {
    const major = relations.filter((relation) => relation.isMinor !== true);
    const minor = relations.filter((relation) => relation.isMinor === true);
    return { major, minor };
  };

  const countersSplit = byMinor(filteredCounters);
  const counteredBySplit = byMinor(filteredCounteredBy);

  const toCharacters = (relations: TraitRelation[]) =>
    relations
      .filter((relation) => relation.subject.type === 'character')
      .map((relation) => relation.subject.name)
      .filter((name) => charactersRecord[name]?.factionId !== factionId);

  return {
    counters: {
      major: toCharacters(countersSplit.major),
      minor: toCharacters(countersSplit.minor),
    },
    counteredBy: {
      major: toCharacters(counteredBySplit.major),
      minor: toCharacters(counteredBySplit.minor),
    },
  };
};

export const getAllSpecialSkillRelations = () => {
  return getRelationsByKind('countersSpecialSkills').concat(
    getRelationsByKind('counteredBySpecialSkills')
  );
};
