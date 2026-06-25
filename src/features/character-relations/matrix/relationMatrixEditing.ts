import type { TraitRelationKind } from '@/data/types';
import { characterFactionById } from '@/features/characters/data/characterMetadata';

import type { RelationMatrixColumnCategory, RelationMatrixEntity } from './relationMatrixViewModel';

const MOUSE_COLLABORATOR_KINDS = ['collaborators'] as const satisfies readonly TraitRelationKind[];

const CHARACTER_COUNTER_KINDS = [
  'counters',
  'counteredBy',
  'counterEachOther',
] as const satisfies readonly TraitRelationKind[];

const RELATION_KIND_LABELS = {
  counters: '克制',
  counteredBy: '被克制',
  counterEachOther: '互克',
  collaborators: '协作',
  countersKnowledgeCards: '克制',
  counteredByKnowledgeCards: '被克制',
  countersSpecialSkills: '克制',
  counteredBySpecialSkills: '被克制',
  advantageMaps: '优势地图',
  advantageModes: '优势模式',
  disadvantageMaps: '劣势地图',
  disadvantageModes: '劣势模式',
} satisfies Record<TraitRelationKind, string>;

const getCharacterColumnFaction = (
  column: RelationMatrixEntity,
  columnCategory: RelationMatrixColumnCategory
) => {
  if (column.factionId) return column.factionId;
  if (columnCategory === 'mouse' || columnCategory === 'cat') return columnCategory;
  return characterFactionById[column.id];
};

export const getLegalRelationKinds = (
  row: RelationMatrixEntity,
  column: RelationMatrixEntity,
  columnCategory: RelationMatrixColumnCategory
): readonly TraitRelationKind[] => {
  if (row.type !== 'character') return [];

  if (column.type === 'character') {
    if (row.id === column.id) return [];

    const rowFaction = characterFactionById[row.id];
    const columnFaction = getCharacterColumnFaction(column, columnCategory);

    if (rowFaction === 'mouse' && columnFaction === 'mouse') {
      return MOUSE_COLLABORATOR_KINDS;
    }

    if (rowFaction && columnFaction && rowFaction !== columnFaction) {
      return CHARACTER_COUNTER_KINDS;
    }

    return [];
  }

  switch (columnCategory) {
    case 'knowledgeCard':
      return ['countersKnowledgeCards', 'counteredByKnowledgeCards'];
    case 'specialSkill':
      return ['countersSpecialSkills', 'counteredBySpecialSkills'];
    case 'map':
      return ['advantageMaps', 'disadvantageMaps'];
    case 'mode':
      return ['advantageModes', 'disadvantageModes'];
    case 'mouse':
    case 'cat':
      return [];
  }
};

export const isEditableRelationCell = (
  row: RelationMatrixEntity,
  column: RelationMatrixEntity,
  columnCategory: RelationMatrixColumnCategory
): boolean => getLegalRelationKinds(row, column, columnCategory).length > 0;

export const getRelationKindLabel = (kind: TraitRelationKind): string => RELATION_KIND_LABELS[kind];

export const getInverseCharacterRelationKind = (
  kind: TraitRelationKind
): TraitRelationKind | null => {
  switch (kind) {
    case 'counters':
      return 'counteredBy';
    case 'counteredBy':
      return 'counters';
    case 'counterEachOther':
    case 'collaborators':
      return kind;
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

export const getSiblingRelationKinds = (
  kind: TraitRelationKind,
  legalKinds: readonly TraitRelationKind[]
): TraitRelationKind[] => legalKinds.filter((legalKind) => legalKind !== kind);
