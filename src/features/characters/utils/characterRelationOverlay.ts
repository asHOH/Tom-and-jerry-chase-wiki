import { CHARACTER_RELATION_KINDS } from '@/lib/edit/characterRelationActions';
import { setNestedProperty } from '@/lib/editUtils';
import { characters } from '@/data/store';
import type { CharacterRelationItem, TraitRelationKind } from '@/data/types';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';

export type EditableCharacterRelations = Record<TraitRelationKind, CharacterRelationItem[]>;

const normalizeCharacterRelationItem = (item: CharacterRelationItem): CharacterRelationItem => ({
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

const ownsCharacterRelationKind = (characterId: string, relationKind: TraitRelationKind) => {
  const characterRecord = characters[characterId] as
    | Partial<Record<TraitRelationKind, CharacterRelationItem[]>>
    | undefined;

  return Array.isArray(characterRecord?.[relationKind]);
};

// Edit-mode relation writes remain page-local overlays under characters.<id>.<relationKind>
// so draft counting, publish payloads, and public replay keep the existing path contract.
export const getCharacterRelationDescriptionPath = (
  relationKind: TraitRelationKind,
  index: number
) => `${relationKind}.${index}`;

export const getEditableCharacterRelations = (
  characterId: string,
  character?: Partial<Record<TraitRelationKind, CharacterRelationItem[]>>
): EditableCharacterRelations => {
  const characterRecord = character ?? characters[characterId];
  const relationRecord = characterRecord as Partial<
    Record<TraitRelationKind, CharacterRelationItem[]>
  >;
  const projectedRelations = getCharacterRelation(characters, characterId);

  if (!characterRecord) {
    return projectedRelations as EditableCharacterRelations;
  }

  const next = { ...projectedRelations } as EditableCharacterRelations;

  CHARACTER_RELATION_KINDS.forEach((relationKind) => {
    const stored = relationRecord[relationKind];
    if (Array.isArray(stored)) {
      next[relationKind] = stored.map(normalizeCharacterRelationItem);
    }
  });

  return next;
};

const writeCharacterRelationItems = (
  characterId: string,
  relationKind: TraitRelationKind,
  items: CharacterRelationItem[]
) => {
  setNestedProperty(characters, `${characterId}.${relationKind}`, items);
  if (characters[characterId]) {
    (characters[characterId] as Record<string, unknown>)[relationKind] = items;
  }
};

const updateCharacterRelationItem = (
  characterId: string,
  relationKind: TraitRelationKind,
  itemId: string,
  updater: (item: CharacterRelationItem) => CharacterRelationItem
) => {
  const current = getEditableCharacterRelations(characterId)[relationKind] ?? [];
  writeCharacterRelationItems(
    characterId,
    relationKind,
    current.map((item) => (item.id === itemId ? updater(item) : item))
  );
};

export const createCharacterRelationItem = (id: string): CharacterRelationItem => ({
  id,
  description: '',
  isMinor: false,
});

export const addCharacterRelationItem = (
  characterId: string,
  relationKind: TraitRelationKind,
  item: CharacterRelationItem
) => {
  const current = getEditableCharacterRelations(characterId)[relationKind] ?? [];
  if (current.some((existing) => existing.id === item.id)) return;
  writeCharacterRelationItems(characterId, relationKind, [...current, item]);
};

export const upsertCharacterRelationItem = (
  characterId: string,
  relationKind: TraitRelationKind,
  item: CharacterRelationItem
) => {
  const normalizedItem = normalizeCharacterRelationItem(item);
  const current = getEditableCharacterRelations(characterId)[relationKind] ?? [];
  const currentIndex = current.findIndex((existing) => existing.id === normalizedItem.id);

  if (currentIndex === -1) {
    writeCharacterRelationItems(characterId, relationKind, [...current, normalizedItem]);
    return;
  }

  const currentItem = current[currentIndex];
  if (currentItem && isSameCharacterRelationItem(currentItem, normalizedItem)) {
    return;
  }

  writeCharacterRelationItems(
    characterId,
    relationKind,
    current.map((existing, index) => (index === currentIndex ? normalizedItem : existing))
  );
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
  const current = getEditableCharacterRelations(characterId)[relationKind] ?? [];
  writeCharacterRelationItems(
    characterId,
    relationKind,
    current.filter((item) => item.id !== itemId)
  );
};

export const removeCharacterRelationItemFromKinds = (
  characterId: string,
  relationKinds: readonly TraitRelationKind[],
  itemId: string
) => {
  relationKinds.forEach((relationKind) => {
    const current = getEditableCharacterRelations(characterId)[relationKind] ?? [];
    const hasTargetItem = current.some((item) => item.id === itemId);

    if (!hasTargetItem && !ownsCharacterRelationKind(characterId, relationKind)) {
      return;
    }

    writeCharacterRelationItems(
      characterId,
      relationKind,
      current.filter((item) => item.id !== itemId)
    );
  });
};
