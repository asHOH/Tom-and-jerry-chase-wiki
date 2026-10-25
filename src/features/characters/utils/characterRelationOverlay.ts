import type { DeepReadonly } from '@/types/deep-readonly';
import { CHARACTER_RELATION_KINDS } from '@/lib/edit/characterRelationActions';
import { setNestedProperty } from '@/lib/editUtils';
import type { CharacterWithFaction } from '@/lib/types';
import type { CharacterRelationItem, TraitRelationKind } from '@/data/types';
import {
  applyCharacterRelationOverrides,
  getCharacterRelation,
  getExplicitCharacterRelation,
} from '@/features/characters/utils/relationReadModel';

import {
  getCharacterRelationPairLocation,
  getInverseCharacterRelationKind,
  isCharacterPairRelationKind,
} from './characterRelationPairs';

export type EditableCharacterRelations = Record<TraitRelationKind, CharacterRelationItem[]>;
type CharacterRelationOverlayRecord = Partial<
  Record<TraitRelationKind, readonly Readonly<CharacterRelationItem>[]>
>;
type CharacterRelationsSource = DeepReadonly<Record<string, CharacterWithFaction>>;
type MutableCharacters = Record<string, CharacterWithFaction>;

const oppositeNonCharacterKind = {
  countersKnowledgeCards: 'counteredByKnowledgeCards',
  counteredByKnowledgeCards: 'countersKnowledgeCards',
  countersSpecialSkills: 'counteredBySpecialSkills',
  counteredBySpecialSkills: 'countersSpecialSkills',
  advantageMaps: 'disadvantageMaps',
  disadvantageMaps: 'advantageMaps',
  advantageModes: 'disadvantageModes',
  disadvantageModes: 'advantageModes',
} as const;

const normalizeCharacterRelationItem = (
  item: Readonly<CharacterRelationItem>
): CharacterRelationItem => ({
  id: item.id,
  description: item.description ?? '',
  isMinor: !!item.isMinor,
  ...(item.tags && item.tags.length > 0
    ? {
        tags: item.tags
          .map((tag) => ({
            counters: tag.counters.trim(),
            counteredBy: tag.counteredBy.trim(),
          }))
          .filter((tag) => tag.counters && tag.counteredBy),
      }
    : {}),
});

const isSameCharacterRelationItem = (
  left: CharacterRelationItem,
  right: CharacterRelationItem
): boolean =>
  left.id === right.id &&
  (left.description ?? '') === (right.description ?? '') &&
  !!left.isMinor === !!right.isMinor &&
  JSON.stringify(left.tags ?? []) === JSON.stringify(right.tags ?? []);

export const getCharacterRelationDescriptionPath = (
  relationKind: TraitRelationKind,
  index: number
) => `${relationKind}.${index}`;

export const getEditableCharacterRelations = (
  characters: CharacterRelationsSource,
  characterId: string,
  character?: unknown
): EditableCharacterRelations => {
  const characterRecord = character ?? characters[characterId];
  const projectedRelations = getCharacterRelation(characters, characterId);

  if (!characterRecord || typeof characterRecord !== 'object') {
    return projectedRelations as EditableCharacterRelations;
  }

  const relationRecord = characterRecord as CharacterRelationOverlayRecord;
  const next = { ...projectedRelations } as EditableCharacterRelations;
  const explicitRelations = getExplicitCharacterRelation(characters, characterId);

  CHARACTER_RELATION_KINDS.forEach((relationKind) => {
    const stored = relationRecord[relationKind];
    if (Array.isArray(stored)) {
      // Keep inferred suggestions visible after an explicit overlay is created,
      // without treating them as stored items or hiding invalid draft entries.
      next[relationKind] = [
        ...stored.map(normalizeCharacterRelationItem),
        ...projectedRelations[relationKind].filter(
          (item) =>
            !stored.some((existing) => existing.id === item.id) &&
            !explicitRelations[relationKind].some((explicit) => explicit.id === item.id)
        ),
      ];
    }
  });

  return applyCharacterRelationOverrides(characters, characterId, next);
};

const writeCharacterRelationItems = (
  characters: MutableCharacters,
  characterId: string,
  relationKind: TraitRelationKind,
  items: CharacterRelationItem[]
) => {
  setNestedProperty(characters, `${characterId}.${relationKind}`, items);
};

const updateCharacterRelationItem = (
  characters: MutableCharacters,
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string,
  updater: (item: CharacterRelationItem) => CharacterRelationItem
) => {
  const displayed = getEditableCharacterRelations(characters, characterId)[relationKind].find(
    (item) => item.id === itemId
  );
  if (!displayed || isSameCharacterRelationItem(displayed, updater(displayed))) return;

  // A deliberate edit may promote this suggestion, but must not copy unrelated
  // suggestions or derived tags into the stored relation collection.
  const explicit = getExplicitCharacterRelation(characters, characterId)[relationKind].find(
    (item) => item.id === itemId
  );
  upsertCharacterRelationItem(
    characters,
    characterId,
    relationKind,
    updater(explicit ?? displayed)
  );
};

export const createCharacterRelationItem = (id: string): CharacterRelationItem => ({
  id,
  description: '',
  isMinor: false,
});

export const addCharacterRelationItem = (
  characters: MutableCharacters,
  characterId: string,
  relationKind: TraitRelationKind,
  item: CharacterRelationItem
) => {
  const current = getExplicitCharacterRelation(characters, characterId)[relationKind];
  if (current.some((existing) => existing.id === item.id)) return;
  upsertCharacterRelationItem(characters, characterId, relationKind, item);
};

export const upsertCharacterRelationItem = (
  characters: MutableCharacters,
  characterId: string,
  relationKind: TraitRelationKind,
  item: CharacterRelationItem
) => {
  const normalizedItem = normalizeCharacterRelationItem(item);
  const current = getExplicitCharacterRelation(characters, characterId)[relationKind];
  const currentIndex = current.findIndex((existing) => existing.id === normalizedItem.id);
  const currentItem = current[currentIndex];
  if (currentItem && isSameCharacterRelationItem(currentItem, normalizedItem)) return;
  const displayed = getCharacterRelation(characters, characterId)[relationKind].find(
    (existing) => existing.id === normalizedItem.id
  );
  if (displayed && isSameCharacterRelationItem(displayed, normalizedItem)) return;

  if (isCharacterPairRelationKind(relationKind)) {
    const location = getCharacterRelationPairLocation(characterId, item.id);
    const { id: _id, ...metadata } = normalizedItem;
    setNestedProperty(characters, location.path, {
      kind:
        location.ownerId === characterId
          ? relationKind
          : getInverseCharacterRelationKind(relationKind),
      ...metadata,
    });
    return;
  }

  const oppositeKind = oppositeNonCharacterKind[relationKind];
  const opposite = getExplicitCharacterRelation(characters, characterId)[oppositeKind];
  if (opposite.some((existing) => existing.id === item.id)) {
    writeCharacterRelationItems(
      characters,
      characterId,
      oppositeKind,
      opposite.filter((existing) => existing.id !== item.id)
    );
  }

  if (currentIndex === -1) {
    writeCharacterRelationItems(characters, characterId, relationKind, [
      ...current,
      normalizedItem,
    ]);
    return;
  }

  writeCharacterRelationItems(
    characters,
    characterId,
    relationKind,
    current.map((existing, index) => (index === currentIndex ? normalizedItem : existing))
  );
};

export const updateCharacterRelationDescription = (
  characters: MutableCharacters,
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string,
  description: string
) => {
  const nextDescription = description.trim();
  updateCharacterRelationItem(characters, characterId, relationKind, itemId, (item) => ({
    ...item,
    description: nextDescription,
  }));
};

export const updateCharacterRelationTags = (
  characters: MutableCharacters,
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string,
  tags: CharacterRelationItem['tags']
) => {
  updateCharacterRelationItem(characters, characterId, relationKind, itemId, (item) => {
    const normalizedTags = tags
      ?.map((tag) => ({
        counters: tag.counters.trim(),
        counteredBy: tag.counteredBy.trim(),
      }))
      .filter((tag) => tag.counters && tag.counteredBy);

    if (!normalizedTags || normalizedTags.length === 0) {
      const { tags: _unused, ...itemWithoutTags } = item;
      return itemWithoutTags;
    }

    return { ...item, tags: normalizedTags };
  });
};

export const toggleCharacterRelationMinor = (
  characters: MutableCharacters,
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string
) => {
  updateCharacterRelationItem(characters, characterId, relationKind, itemId, (item) => ({
    ...item,
    isMinor: !item.isMinor,
  }));
};

export const removeCharacterRelationItem = (
  characters: MutableCharacters,
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string
) => {
  if (isCharacterPairRelationKind(relationKind)) {
    const displayed = getEditableCharacterRelations(characters, characterId)[relationKind];
    if (!displayed.some((item) => item.id === itemId)) return;
    setNestedProperty(characters, getCharacterRelationPairLocation(characterId, itemId).path, null);
    return;
  }
  for (const kind of [relationKind, oppositeNonCharacterKind[relationKind]]) {
    const current = getExplicitCharacterRelation(characters, characterId)[kind];
    if (!current.some((item) => item.id === itemId)) continue;
    writeCharacterRelationItems(
      characters,
      characterId,
      kind,
      current.filter((item) => item.id !== itemId)
    );
  }
};
