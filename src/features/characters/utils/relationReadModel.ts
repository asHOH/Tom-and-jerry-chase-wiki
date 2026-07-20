import type { DeepReadonly } from '@/types/deep-readonly';
import type { CharacterWithFaction } from '@/lib/types';
import type {
  CharacterRelation,
  CharacterRelationItem,
  FactionId,
  SingleItem,
  TraitRelation,
  TraitRelationKind,
} from '@/data/types';
import { characterRelationTagPairs } from '@/features/characters/utils/characterRelationTags';
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

const characterTargetRelationKinds = [
  'counters',
  'counteredBy',
  'counterEachOther',
  'collaborators',
] satisfies readonly TraitRelationKind[];

const nonCharacterTargetRelationGroups = [
  {
    domain: 'knowledgeCard',
    kinds: ['countersKnowledgeCards', 'counteredByKnowledgeCards'],
  },
  {
    domain: 'specialSkill',
    kinds: ['countersSpecialSkills', 'counteredBySpecialSkills'],
  },
  {
    domain: 'map',
    kinds: ['advantageMaps', 'disadvantageMaps'],
  },
  {
    domain: 'mode',
    kinds: ['advantageModes', 'disadvantageModes'],
  },
] satisfies ReadonlyArray<{
  domain: RelationTargetDomain;
  kinds: readonly TraitRelationKind[];
}>;

type RelationTargetDomain = 'character' | 'knowledgeCard' | 'specialSkill' | 'map' | 'mode';
type RelationDropReason = 'illegal' | 'conflicting';

type RelationProjectionDropWarning = {
  rowCharacterId: string;
  targetDomain: RelationTargetDomain;
  targetId: string;
  droppedKind: TraitRelationKind;
  keptKind?: TraitRelationKind;
  reason: RelationDropReason;
};

type NormalizeCharacterRelationProjectionOptions = {
  getCharacterFactionId: (characterId: string) => FactionId | undefined;
};

const warnedProjectionDropKeys = new Set<string>();

const warnProjectionDrop = (warning: RelationProjectionDropWarning) => {
  if (process.env.NODE_ENV !== 'development') return;

  const warningKey = [
    warning.rowCharacterId,
    warning.targetDomain,
    warning.targetId,
    warning.droppedKind,
    warning.keptKind ?? '',
    warning.reason,
  ].join('::');
  if (warnedProjectionDropKeys.has(warningKey)) return;
  warnedProjectionDropKeys.add(warningKey);

  console.warn('[relationReadModel] Dropped relation projection item.', warning);
};

const isLegalCharacterTargetRelation = (
  rowCharacterId: string,
  targetId: string,
  relationKind: TraitRelationKind,
  getCharacterFactionId: (characterId: string) => FactionId | undefined
) => {
  if (rowCharacterId === targetId) return false;

  const rowFactionId = getCharacterFactionId(rowCharacterId);
  const targetFactionId = getCharacterFactionId(targetId);

  if (!rowFactionId || !targetFactionId) return true;

  if (rowFactionId === 'mouse' && targetFactionId === 'mouse') {
    return relationKind === 'collaborators';
  }

  if (rowFactionId === 'cat' && targetFactionId === 'cat') {
    return false;
  }

  return (
    relationKind === 'counters' ||
    relationKind === 'counteredBy' ||
    relationKind === 'counterEachOther'
  );
};

const normalizeRelationTargetDomain = (
  source: CharacterRelation,
  target: CharacterRelation,
  rowCharacterId: string,
  targetDomain: RelationTargetDomain,
  relationKinds: readonly TraitRelationKind[]
) => {
  const keptKindByTargetId = new Map<string, TraitRelationKind>();

  relationKinds.forEach((relationKind) => {
    source[relationKind].forEach((item) => {
      const keptKind = keptKindByTargetId.get(item.id);
      if (keptKind) {
        warnProjectionDrop({
          rowCharacterId,
          targetDomain,
          targetId: item.id,
          droppedKind: relationKind,
          keptKind,
          reason: 'conflicting',
        });
        return;
      }

      keptKindByTargetId.set(item.id, relationKind);
      target[relationKind].push(item);
    });
  });
};

export const normalizeCharacterRelationProjection = (
  rowCharacterId: string,
  relation: CharacterRelation,
  options: NormalizeCharacterRelationProjectionOptions
): CharacterRelation => {
  const normalized = createEmptyRelation();
  const keptCharacterKindByTargetId = new Map<string, TraitRelationKind>();

  characterTargetRelationKinds.forEach((relationKind) => {
    relation[relationKind].forEach((item) => {
      if (
        !isLegalCharacterTargetRelation(
          rowCharacterId,
          item.id,
          relationKind,
          options.getCharacterFactionId
        )
      ) {
        warnProjectionDrop({
          rowCharacterId,
          targetDomain: 'character',
          targetId: item.id,
          droppedKind: relationKind,
          reason: 'illegal',
        });
        return;
      }

      const keptKind = keptCharacterKindByTargetId.get(item.id);
      if (keptKind) {
        warnProjectionDrop({
          rowCharacterId,
          targetDomain: 'character',
          targetId: item.id,
          droppedKind: relationKind,
          keptKind,
          reason: 'conflicting',
        });
        return;
      }

      keptCharacterKindByTargetId.set(item.id, relationKind);
      normalized[relationKind].push(item);
    });
  });

  nonCharacterTargetRelationGroups.forEach(({ domain, kinds }) => {
    normalizeRelationTargetDomain(relation, normalized, rowCharacterId, domain, kinds);
  });

  return normalized;
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
    ...(relation.tags && relation.tags.length > 0
      ? { tags: relation.tags.map((tag) => ({ ...tag })) }
      : {}),
  };
};

const mergeRelationItems = (
  primary: CharacterRelationItem[],
  secondary: CharacterRelationItem[]
) => {
  return [...primary, ...secondary.filter((item) => !primary.some((p) => p.id === item.id))];
};

const mergeTagDerivedRelationItems = (
  primary: CharacterRelationItem[],
  tagDerived: CharacterRelationItem[]
): CharacterRelationItem[] => {
  const merged = primary.map((item) => {
    const derivedItem = tagDerived.find((candidate) => candidate.id === item.id);
    if (!derivedItem?.tags?.length) return item;

    const tags = [...(item.tags ?? [])];
    derivedItem.tags.forEach((tag) => {
      if (
        !tags.some(
          (existing) =>
            existing.counters === tag.counters && existing.counteredBy === tag.counteredBy
        )
      ) {
        tags.push(tag);
      }
    });
    return { ...item, tags };
  });

  return [
    ...merged,
    ...tagDerived.filter((item) => !primary.some((existing) => existing.id === item.id)),
  ];
};

const normalizeLegacyItems = (
  items: CharacterRelationItem[] | undefined
): CharacterRelationItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: item.id,
    description: item.description ?? '',
    isMinor: !!item.isMinor,
    ...(item.tags && item.tags.length > 0 ? { tags: item.tags.map((tag) => ({ ...tag })) } : {}),
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
      ...(item.tags && item.tags.length > 0 ? { tags: item.tags.map((tag) => ({ ...tag })) } : {}),
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

const buildTagDerivedCharacterRelations = (
  charactersRecord: DeepReadonly<Record<string, CharacterWithFaction>>,
  id: string
): Pick<CharacterRelation, 'counters' | 'counteredBy'> => {
  const current = charactersRecord[id];
  if (!current) return { counters: [], counteredBy: [] };

  const currentTags = new Set(current.counterTags ?? []);
  const counters: CharacterRelationItem[] = [];
  const counteredBy: CharacterRelationItem[] = [];

  Object.entries(charactersRecord).forEach(([otherId, other]) => {
    if (otherId === id || other.factionId === current.factionId) return;

    const otherTags = new Set(other.counterTags ?? []);
    const counterTags = characterRelationTagPairs
      .filter((tag) => currentTags.has(tag.counters) && otherTags.has(tag.counteredBy))
      .map((tag) => ({ ...tag }));
    const counteredByTags = characterRelationTagPairs
      .filter((tag) => currentTags.has(tag.counteredBy) && otherTags.has(tag.counters))
      .map((tag) => ({ ...tag }));

    if (counterTags.length > 0) {
      counters.push({
        id: otherId,
        description: `${id}的“${counterTags.map((tag) => tag.counters).join('、')}”特性克制${otherId}。`,
        isMinor: false,
        tags: counterTags,
      });
    }

    if (counteredByTags.length > 0) {
      counteredBy.push({
        id: otherId,
        description: `${id}的“${counteredByTags.map((tag) => tag.counteredBy).join('、')}”特性会被${otherId}克制。`,
        isMinor: false,
        tags: counteredByTags,
      });
    }
  });

  return { counters, counteredBy };
};

const mergeCharacterRelationProjection = (
  sharedTraitRelations: CharacterRelation,
  sharedInverseCharacterRelations: Pick<
    CharacterRelation,
    'collaborators' | 'counterEachOther' | 'counteredBy' | 'counters'
  >,
  legacyOverlayProjection: LegacyOverlayProjection,
  tagDerivedRelations: Pick<CharacterRelation, 'counters' | 'counteredBy'>
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

  merged.counters = mergeTagDerivedRelationItems(merged.counters, tagDerivedRelations.counters);
  merged.counteredBy = mergeTagDerivedRelationItems(
    merged.counteredBy,
    tagDerivedRelations.counteredBy
  );

  return merged;
};

// The character detail page reads a hybrid projection: shared relation traits,
// inverse shared character links, and page-local legacy overlay arrays.
export function getCharacterRelation(
  charactersRecord: DeepReadonly<Record<string, CharacterWithFaction>>,
  id: string
): CharacterRelation {
  if (!charactersRecord[id]) return defaultRelation;

  const mergedRelation = mergeCharacterRelationProjection(
    buildSharedTraitRelations(id),
    buildSharedInverseCharacterRelations(id),
    buildLegacyOverlayRelations(charactersRecord, id),
    buildTagDerivedCharacterRelations(charactersRecord, id)
  );

  return normalizeCharacterRelationProjection(id, mergedRelation, {
    getCharacterFactionId: (characterId) => charactersRecord[characterId]?.factionId,
  });
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
