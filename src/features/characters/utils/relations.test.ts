import { characterRelationTraits, getCharacterRelationKey } from '@/data/characterRelations';
import type { CharacterRelation, CharacterRelationTrait, TraitRelation } from '@/data/types';
import { getRelationIndex } from '@/features/shared/traits/relationIndex';
import { characterRelationsEdit, characters } from '@/data';

import {
  getAllSpecialSkillRelations,
  getCharacterRelation,
  getSpecialSkillRelationSummary,
} from './relationReadModel';

const restoreRecord = (target: Record<string, unknown>, snapshot: Record<string, unknown>) => {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.entries(snapshot).forEach(([key, value]) => {
    target[key] = structuredClone(value);
  });
};

const findSharedCharacterRelation = (
  kind: 'collaborators' | 'counterEachOther' | 'counteredBy' | 'counters'
): TraitRelation => {
  const relation = characterRelationTraits.find(
    (trait): trait is typeof trait & { relation: TraitRelation } =>
      trait.relation.kind === kind &&
      trait.relation.subject.type === 'character' &&
      trait.relation.target.type === 'character' &&
      trait.relation.subject.name in characters &&
      trait.relation.target.name in characters
  )?.relation;

  if (!relation) throw new Error(`Missing shared character relation fixture for ${kind}.`);
  return relation;
};

describe('getCharacterRelation', () => {
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

  it('should preserve graph-derived mutual relations for both character pages', () => {
    const relation = findSharedCharacterRelation('counterEachOther');

    expect(getCharacterRelation(characters, relation.subject.name).counterEachOther).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: relation.target.name })])
    );
    expect(getCharacterRelation(characters, relation.target.name).counterEachOther).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: relation.subject.name })])
    );
  });

  it('should project directed relations onto the inverse character page', () => {
    const relation = findSharedCharacterRelation('counters');

    expect(getCharacterRelation(characters, relation.subject.name).counters).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: relation.target.name })])
    );
    expect(getCharacterRelation(characters, relation.target.name).counteredBy).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: relation.subject.name })])
    );
  });

  it('should ignore deprecated Character relation arrays', () => {
    (characters['莱特宁'] as unknown as Partial<CharacterRelation>).counteredBy = [
      { id: '__legacy__', description: 'legacy relation', isMinor: true },
    ];

    expect(getCharacterRelation(characters, '莱特宁').counteredBy).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '__legacy__' })])
    );
  });

  it('should rebuild the shared relation index when characterRelations changes', () => {
    const relation = findSharedCharacterRelation('counters');
    const key = getCharacterRelationKey({ description: '', relation });
    const original = characterRelationsEdit[key]!;
    const previousIndex = getRelationIndex();
    const updated: CharacterRelationTrait = {
      ...original,
      description: '__updated_relation_description__',
    };

    characterRelationsEdit[key] = updated;

    expect(getRelationIndex()).not.toBe(previousIndex);
    expect(
      getCharacterRelation(characters, relation.subject.name).counters.find(
        (item) => item.id === relation.target.name
      )?.description
    ).toBe('__updated_relation_description__');
  });

  it('should keep special-skill relation summaries backed by the canonical store', () => {
    const summary = getSpecialSkillRelationSummary(characters, '应急治疗', 'mouse');
    expect(summary).toHaveProperty('counters');
    expect(summary).toHaveProperty('counteredBy');
    expect(getAllSpecialSkillRelations().length).toBeGreaterThan(0);
  });
});
