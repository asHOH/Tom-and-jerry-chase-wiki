import { getCharacterRelationKey } from '@/data/characterRelations';
import { cardsEdit, characterRelationsEdit, characters, specialSkillsEdit } from '@/data/store';
import type {
  CharacterRelation,
  CharacterRelationItem,
  CharacterRelationTrait,
  FactionId,
  SingleItem,
  TraitRelationKind,
} from '@/data/types';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';

export type EditableCharacterRelations = CharacterRelation;

const normalizeCharacterRelationItem = (
  item: Readonly<CharacterRelationItem>
): CharacterRelationItem => ({
  id: item.id,
  description: item.description ?? '',
  isMinor: !!item.isMinor,
});

const isSameCharacterRelationItem = (
  left: CharacterRelationItem,
  right: CharacterRelationItem
): boolean =>
  left.id === right.id &&
  (left.description ?? '') === (right.description ?? '') &&
  !!left.isMinor === !!right.isMinor;

const getInverseCharacterRelationKind = (
  relationKind: TraitRelationKind
): TraitRelationKind | null => {
  switch (relationKind) {
    case 'counters':
      return 'counteredBy';
    case 'counteredBy':
      return 'counters';
    case 'counterEachOther':
    case 'collaborators':
      return relationKind;
    case 'countersKnowledgeCards':
    case 'counteredByKnowledgeCards':
    case 'countersSpecialSkills':
    case 'counteredBySpecialSkills':
    case 'advantageMaps':
    case 'advantageModes':
    case 'disadvantageMaps':
    case 'disadvantageModes':
      return null;
  }
};

const getRelationTargetType = (relationKind: TraitRelationKind): SingleItem['type'] => {
  switch (relationKind) {
    case 'counters':
    case 'counteredBy':
    case 'counterEachOther':
    case 'collaborators':
      return 'character';
    case 'countersKnowledgeCards':
    case 'counteredByKnowledgeCards':
      return 'knowledgeCard';
    case 'countersSpecialSkills':
    case 'counteredBySpecialSkills':
      return 'specialSkill';
    case 'advantageMaps':
    case 'disadvantageMaps':
      return 'map';
    case 'advantageModes':
    case 'disadvantageModes':
      return 'mode';
  }
};

const getOppositeFactionId = (factionId: FactionId): FactionId =>
  factionId === 'cat' ? 'mouse' : 'cat';

const getTargetFactionId = (
  characterId: string,
  relationKind: TraitRelationKind,
  targetId: string
): FactionId | undefined => {
  const targetType = getRelationTargetType(relationKind);
  if (targetType === 'knowledgeCard') {
    return cardsEdit[targetId]?.factionId;
  }

  if (targetType !== 'specialSkill') return undefined;

  const characterFactionId = characters[characterId]?.factionId;
  if (characterFactionId) {
    const oppositeFactionId = getOppositeFactionId(characterFactionId);
    if (specialSkillsEdit[oppositeFactionId][targetId]) return oppositeFactionId;
  }

  const hasCatSkill = !!specialSkillsEdit.cat[targetId];
  const hasMouseSkill = !!specialSkillsEdit.mouse[targetId];
  if (hasCatSkill !== hasMouseSkill) return hasCatSkill ? 'cat' : 'mouse';
  return undefined;
};

const createTarget = (
  characterId: string,
  relationKind: TraitRelationKind,
  targetId: string
): SingleItem => {
  const type = getRelationTargetType(relationKind);
  const factionId = getTargetFactionId(characterId, relationKind, targetId);
  return {
    name: targetId,
    type,
    ...(factionId ? { factionId } : {}),
  };
};

const isProjectedRelation = (
  trait: CharacterRelationTrait,
  characterId: string,
  relationKind: TraitRelationKind,
  targetId: string
): boolean => {
  const { relation } = trait;
  if (
    relation.kind === relationKind &&
    relation.subject.type === 'character' &&
    relation.subject.name === characterId &&
    relation.target.name === targetId
  ) {
    return true;
  }

  if (
    relation.target.type !== 'character' ||
    relation.target.name !== characterId ||
    relation.subject.type !== 'character' ||
    relation.subject.name !== targetId
  ) {
    return false;
  }

  return getInverseCharacterRelationKind(relation.kind) === relationKind;
};

const findProjectedRelations = (
  characterId: string,
  relationKinds: readonly TraitRelationKind[],
  targetId: string
): Array<[string, CharacterRelationTrait]> =>
  Object.entries(characterRelationsEdit).filter(([, trait]) =>
    relationKinds.some((relationKind) =>
      isProjectedRelation(trait, characterId, relationKind, targetId)
    )
  );

// Relation descriptions are saved through the callbacks below. Returning no
// character path prevents the generic inline editor from reading legacy fields.
export const getCharacterRelationDescriptionPath = (
  _relationKind: TraitRelationKind,
  _index: number
): undefined => undefined;

export const getEditableCharacterRelations = (
  characterId: string,
  _character?: unknown
): EditableCharacterRelations => getCharacterRelation(characters, characterId);

export const createCharacterRelationItem = (id: string): CharacterRelationItem => ({
  id,
  description: '',
  isMinor: false,
});

export const upsertCharacterRelationItem = (
  characterId: string,
  relationKind: TraitRelationKind,
  item: CharacterRelationItem
) => {
  const normalizedItem = normalizeCharacterRelationItem(item);
  const existing = findProjectedRelations(characterId, [relationKind], normalizedItem.id)[0];

  if (existing) {
    const [key, trait] = existing;
    const currentItem = {
      id: normalizedItem.id,
      description: trait.relation.description ?? trait.description ?? '',
      isMinor: !!trait.relation.isMinor,
    };
    if (isSameCharacterRelationItem(currentItem, normalizedItem)) return;

    const { description: _relationDescription, ...relation } = trait.relation;
    characterRelationsEdit[key] = {
      description: normalizedItem.description ?? '',
      relation: {
        ...relation,
        isMinor: normalizedItem.isMinor,
      },
    };
    return;
  }

  const trait: CharacterRelationTrait = {
    description: normalizedItem.description ?? '',
    relation: {
      kind: relationKind,
      subject: { name: characterId, type: 'character' },
      target: createTarget(characterId, relationKind, normalizedItem.id),
      isMinor: normalizedItem.isMinor,
    },
  };
  characterRelationsEdit[getCharacterRelationKey(trait)] = trait;
};

export const addCharacterRelationItem = (
  characterId: string,
  relationKind: TraitRelationKind,
  item: CharacterRelationItem
) => {
  if (findProjectedRelations(characterId, [relationKind], item.id).length > 0) return;
  upsertCharacterRelationItem(characterId, relationKind, item);
};

const updateCharacterRelationItem = (
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string,
  updater: (item: CharacterRelationItem) => CharacterRelationItem
) => {
  const current = getEditableCharacterRelations(characterId)[relationKind].find(
    (item) => item.id === itemId
  );
  if (!current) return;
  upsertCharacterRelationItem(characterId, relationKind, updater(current));
};

export const updateCharacterRelationDescription = (
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string,
  description: string
) => {
  const nextDescription = description.trim();
  updateCharacterRelationItem(characterId, relationKind, itemId, (item) => ({
    ...item,
    description: nextDescription,
  }));
};

export const toggleCharacterRelationMinor = (
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string
) => {
  updateCharacterRelationItem(characterId, relationKind, itemId, (item) => ({
    ...item,
    isMinor: !item.isMinor,
  }));
};

export const removeCharacterRelationItem = (
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string
) => {
  findProjectedRelations(characterId, [relationKind], itemId).forEach(([key]) => {
    delete characterRelationsEdit[key];
  });
};

export const removeCharacterRelationItemFromKinds = (
  characterId: string,
  relationKinds: readonly TraitRelationKind[],
  itemId: string
) => {
  findProjectedRelations(characterId, relationKinds, itemId).forEach(([key]) => {
    delete characterRelationsEdit[key];
  });
};
