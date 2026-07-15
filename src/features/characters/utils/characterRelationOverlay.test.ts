import type { CharacterRelationTrait, TraitRelationKind } from '@/data/types';
import { characterRelationsEdit, characters } from '@/data';

import {
  addCharacterRelationItem,
  createCharacterRelationItem,
  getCharacterRelationDescriptionPath,
  getEditableCharacterRelations,
  removeCharacterRelationItem,
  removeCharacterRelationItemFromKinds,
  toggleCharacterRelationMinor,
  updateCharacterRelationDescription,
  upsertCharacterRelationItem,
} from './characterRelationOverlay';

const restoreRecord = (target: Record<string, unknown>, snapshot: Record<string, unknown>) => {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.entries(snapshot).forEach(([key, value]) => {
    target[key] = structuredClone(value);
  });
};

const findRelation = (
  subjectId: string,
  kind: TraitRelationKind,
  targetId: string
): [string, CharacterRelationTrait] | undefined =>
  Object.entries(characterRelationsEdit).find(
    ([, trait]) =>
      trait.relation.subject.name === subjectId &&
      trait.relation.kind === kind &&
      trait.relation.target.name === targetId
  );

describe('characterRelationOverlay', () => {
  let relationSnapshot: Record<string, unknown>;
  let characterSnapshot: Record<string, unknown>;

  beforeEach(() => {
    relationSnapshot = structuredClone(characterRelationsEdit) as Record<string, unknown>;
    characterSnapshot = structuredClone(characters) as Record<string, unknown>;
  });

  afterEach(() => {
    restoreRecord(characterRelationsEdit as Record<string, unknown>, relationSnapshot);
    restoreRecord(characters as Record<string, unknown>, characterSnapshot);
  });

  it('should not expose deprecated character relation description paths', () => {
    expect(getCharacterRelationDescriptionPath('counteredBy', 2)).toBeUndefined();
  });

  it('should ignore deprecated character relation fields in editable views', () => {
    const expected = getEditableCharacterRelations('莱特宁');
    const actual = getEditableCharacterRelations('莱特宁', {
      counteredBy: [{ id: '__legacy__', description: 'legacy', isMinor: true }],
    });

    expect(actual).toEqual(expected);
    expect(actual.counteredBy).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '__legacy__' })])
    );
  });

  it('should add and update canonical characterRelations entries without touching Character', () => {
    addCharacterRelationItem('莱特宁', 'counteredBy', createCharacterRelationItem('__added__'));
    updateCharacterRelationDescription('莱特宁', 'counteredBy', '__added__', '  canonical note  ');
    toggleCharacterRelationMinor('莱特宁', 'counteredBy', '__added__');

    expect(findRelation('莱特宁', 'counteredBy', '__added__')?.[1]).toEqual({
      description: 'canonical note',
      relation: {
        kind: 'counteredBy',
        subject: { name: '莱特宁', type: 'character' },
        target: { name: '__added__', type: 'character' },
        isMinor: true,
      },
    });
    expect(
      (characters['莱特宁'] as unknown as Record<string, unknown>).counteredBy
    ).toBeUndefined();
  });

  it('should update inverse projections by replacing the existing canonical edge', () => {
    const projected = getEditableCharacterRelations('莱特宁').counteredBy[0]!;
    const existing = Object.entries(characterRelationsEdit).find(([, trait]) => {
      const relation = trait.relation;
      return (
        (relation.subject.name === '莱特宁' &&
          relation.target.name === projected.id &&
          relation.kind === 'counteredBy') ||
        (relation.subject.name === projected.id &&
          relation.target.name === '莱特宁' &&
          relation.kind === 'counters')
      );
    });
    expect(existing).toBeDefined();

    upsertCharacterRelationItem('莱特宁', 'counteredBy', {
      ...projected,
      description: 'updated through inverse projection',
      isMinor: !projected.isMinor,
    });

    expect(characterRelationsEdit[existing![0]]?.description).toBe(
      'updated through inverse projection'
    );
    expect(Object.keys(characterRelationsEdit)).toHaveLength(Object.keys(relationSnapshot).length);
  });

  it('should avoid duplicate no-op upserts', () => {
    const item = { id: '__upsert__', description: 'updated', isMinor: true };
    upsertCharacterRelationItem('莱特宁', 'counteredBy', item);
    const beforeNoop = findRelation('莱特宁', 'counteredBy', item.id)?.[1];

    upsertCharacterRelationItem('莱特宁', 'counteredBy', item);

    expect(findRelation('莱特宁', 'counteredBy', item.id)?.[1]).toBe(beforeNoop);
  });

  it('should remove canonical entries through direct and inverse projections', () => {
    const projected = getEditableCharacterRelations('莱特宁').counteredBy[0]!;
    removeCharacterRelationItemFromKinds('莱特宁', ['counteredBy', 'counters'], projected.id);

    expect(getEditableCharacterRelations('莱特宁').counteredBy).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: projected.id })])
    );

    addCharacterRelationItem('莱特宁', 'counteredBy', createCharacterRelationItem('__remove__'));
    removeCharacterRelationItem('莱特宁', 'counteredBy', '__remove__');
    expect(findRelation('莱特宁', 'counteredBy', '__remove__')).toBeUndefined();
  });
});
