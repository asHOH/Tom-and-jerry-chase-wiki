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
import { characters } from '@/data';

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

const buildRelationsFromLegacy = (id: string): CharacterRelation => {
  const legacy = createEmptyRelation();
  const current = characters[id] as Partial<CharacterRelation> | undefined;

  if (current) {
    relationKeys.forEach((key) => {
      const stored = current[key];
      if (Array.isArray(stored)) {
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

  Object.entries(characters).forEach(([otherId, other]) => {
    if (otherId === id) return;
    const otherLegacy = other as Partial<CharacterRelation>;
    addInverse(otherLegacy.counters, 'counteredBy', otherId);
    addInverse(otherLegacy.counteredBy, 'counters', otherId);
    addInverse(otherLegacy.counterEachOther, 'counterEachOther', otherId);
    addInverse(otherLegacy.collaborators, 'collaborators', otherId);
  });

  return legacy;
};

const buildRelationsFromTraits = (id: string): CharacterRelation => {
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

export function getCharacterRelation(id: string): CharacterRelation {
  if (!characters[id]) return defaultRelation;

  const traitRelations = buildRelationsFromTraits(id);

  const target: SingleItem = { name: id, type: 'character' };
  const countersFromOpponents = getRelationsByTarget('counteredBy', target).map((relation) =>
    toRelationItem(relation, false)
  );
  const counteredByFromOpponents = getRelationsByTarget('counters', target).map((relation) =>
    toRelationItem(relation, false)
  );
  const counterEachOtherFromOpponents = getRelationsByTarget('counterEachOther', target).map(
    (relation) => toRelationItem(relation, false)
  );
  const collaboratorsFromOpponents = getRelationsByTarget('collaborators', target).map((relation) =>
    toRelationItem(relation, false)
  );

  const mergedCounters = mergeRelationItems(traitRelations.counters, countersFromOpponents);
  const mergedCounteredBy = mergeRelationItems(
    traitRelations.counteredBy,
    counteredByFromOpponents
  );
  const mergedCounterEachOther = mergeRelationItems(
    traitRelations.counterEachOther,
    counterEachOtherFromOpponents
  );
  const mergedCollaborators = mergeRelationItems(
    traitRelations.collaborators,
    collaboratorsFromOpponents
  );

  const merged = {
    ...traitRelations,
    counters: mergedCounters,
    counteredBy: mergedCounteredBy,
    counterEachOther: mergedCounterEachOther,
    collaborators: mergedCollaborators,
  };

  const legacyRelations = buildRelationsFromLegacy(id);
  relationKeys.forEach((key) => {
    const legacyItems = legacyRelations[key];
    if (legacyItems.length > 0) {
      merged[key] = mergeRelationItems(legacyItems, merged[key]);
    }
  });

  return merged;
}

export const getSpecialSkillRelationSummary = (
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
      .filter((name) => characters[name]?.factionId !== factionId);

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
