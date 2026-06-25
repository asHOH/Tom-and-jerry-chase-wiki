import type { TraitRelationKind } from '@/data/types';

import {
  getInverseCharacterRelationKind,
  getLegalRelationKinds,
  getRelationKindLabel,
  getSiblingRelationKinds,
  isEditableRelationCell,
} from './relationMatrixEditing';
import type { RelationMatrixColumnCategory, RelationMatrixEntity } from './relationMatrixViewModel';

const createCharacter = (id: string): RelationMatrixEntity => ({
  key: `character:${id}:`,
  id,
  label: id,
  type: 'character',
  href: `/characters/${encodeURIComponent(id)}`,
});

const createTarget = (
  id: string,
  type: RelationMatrixEntity['type'],
  factionId?: RelationMatrixEntity['factionId']
): RelationMatrixEntity => ({
  key: `${type}:${id}:${factionId ?? ''}`,
  id,
  label: id,
  type,
  href: `/${type}/${encodeURIComponent(id)}`,
  ...(factionId ? { factionId } : {}),
});

type NonCharacterColumnCategory = Exclude<RelationMatrixColumnCategory, 'mouse' | 'cat'>;

const TARGET_TYPE_BY_COLUMN_CATEGORY = {
  knowledgeCard: 'knowledgeCard',
  specialSkill: 'specialSkill',
  map: 'map',
  mode: 'mode',
} satisfies Record<NonCharacterColumnCategory, RelationMatrixEntity['type']>;

describe('relationMatrixEditing', () => {
  it('allows mouse collaborator cells and rejects self-cells', () => {
    const row = createCharacter('杰瑞');
    const column = createCharacter('泰菲');

    expect(getLegalRelationKinds(row, column, 'mouse')).toEqual(['collaborators']);
    expect(isEditableRelationCell(row, column, 'mouse')).toBe(true);
    expect(getLegalRelationKinds(row, row, 'mouse')).toEqual([]);
    expect(isEditableRelationCell(row, row, 'mouse')).toBe(false);
  });

  it('allows cross-faction character counter kinds', () => {
    const row = createCharacter('杰瑞');
    const column = createCharacter('汤姆');

    expect(getLegalRelationKinds(row, column, 'cat')).toEqual([
      'counters',
      'counteredBy',
      'counterEachOther',
    ]);
  });

  it.each([
    ['knowledgeCard', ['countersKnowledgeCards', 'counteredByKnowledgeCards']],
    ['specialSkill', ['countersSpecialSkills', 'counteredBySpecialSkills']],
    ['map', ['advantageMaps', 'disadvantageMaps']],
    ['mode', ['advantageModes', 'disadvantageModes']],
  ] as const satisfies readonly (readonly [
    NonCharacterColumnCategory,
    readonly TraitRelationKind[],
  ])[])('maps %s targets to legal relation kinds', (columnCategory, expectedKinds) => {
    const row = createCharacter('杰瑞');
    const column = createTarget('目标', TARGET_TYPE_BY_COLUMN_CATEGORY[columnCategory]);

    expect(getLegalRelationKinds(row, column, columnCategory)).toEqual(expectedKinds);
  });

  it('maps inverse relation kinds for character targets only', () => {
    expect(getInverseCharacterRelationKind('counters')).toBe('counteredBy');
    expect(getInverseCharacterRelationKind('counteredBy')).toBe('counters');
    expect(getInverseCharacterRelationKind('counterEachOther')).toBe('counterEachOther');
    expect(getInverseCharacterRelationKind('collaborators')).toBe('collaborators');
    expect(getInverseCharacterRelationKind('advantageMaps')).toBeNull();
  });

  it('exposes labels and sibling kinds for relation editing controls', () => {
    expect(getRelationKindLabel('counters')).toBe('克制');
    expect(getRelationKindLabel('counteredBy')).toBe('被克制');
    expect(getRelationKindLabel('counterEachOther')).toBe('互克');
    expect(getRelationKindLabel('collaborators')).toBe('协作');
    expect(getRelationKindLabel('advantageMaps')).toBe('优势地图');
    expect(getRelationKindLabel('disadvantageModes')).toBe('劣势模式');

    expect(getSiblingRelationKinds('counters', ['counters', 'counteredBy'])).toEqual([
      'counteredBy',
    ]);
  });
});
