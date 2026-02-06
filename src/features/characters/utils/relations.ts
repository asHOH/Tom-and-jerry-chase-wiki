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
  refreshRelationIndex,
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

  refreshRelationIndex();

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

  return {
    ...traitRelations,
    counters: mergedCounters,
    counteredBy: mergedCounteredBy,
    counterEachOther: mergedCounterEachOther,
    collaborators: mergedCollaborators,
  };
}

export const getSpecialSkillRelationSummary = (
  skillName: string,
  factionId: SingleItem['factionId']
) => {
  refreshRelationIndex();
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
  refreshRelationIndex();
  return getRelationsByKind('countersSpecialSkills').concat(
    getRelationsByKind('counteredBySpecialSkills')
  );
};
