import { setNestedProperty } from '@/lib/editUtils';
import { CharacterRelationItem, type TraitRelationKind } from '@/data/types';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';
import { characters } from '@/data';

export const characterRelationKinds: TraitRelationKind[] = [
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

export type EditableCharacterRelations = Record<TraitRelationKind, CharacterRelationItem[]>;

const normalizeCharacterRelationItem = (item: CharacterRelationItem): CharacterRelationItem => ({
  id: item.id,
  description: item.description ?? '',
  isMinor: !!item.isMinor,
});

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
  const projectedRelations = getCharacterRelation(characterId);

  if (!characterRecord) {
    return projectedRelations as EditableCharacterRelations;
  }

  const next = { ...projectedRelations } as EditableCharacterRelations;

  characterRelationKinds.forEach((relationKind) => {
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
