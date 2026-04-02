import { getRelationIndex } from '@/features/shared/traits/relationIndex';
import { characters } from '@/data';

import {
  getAllSpecialSkillRelations,
  getCharacterRelation,
  getSpecialSkillRelationSummary,
} from './relations';

const cloneCharacters = () => structuredClone(characters);

const restoreCharacters = (snapshot: Record<string, unknown>) => {
  Object.keys(characters).forEach((key) => {
    delete (characters as Record<string, unknown>)[key];
  });

  Object.entries(snapshot).forEach(([key, value]) => {
    (characters as Record<string, unknown>)[key] = structuredClone(value);
  });
};

describe('getCharacterRelation', () => {
  let snapshot: Record<string, unknown>;

  beforeEach(() => {
    snapshot = cloneCharacters() as Record<string, unknown>;
  });

  afterEach(() => {
    restoreCharacters(snapshot);
  });

  it('should preserve graph-derived inverse relations for the current target page', () => {
    const relations = getCharacterRelation('恶魔杰瑞');

    expect(relations.counteredBy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '莱特宁',
        }),
      ])
    );
  });

  it('should merge page-local legacy overlays into the projected relation view', () => {
    (
      characters['莱特宁'] as unknown as {
        counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
      }
    ).counteredBy = [
      {
        id: '__test_overlay__',
        description: 'legacy overlay relation',
        isMinor: true,
      },
    ];

    const relations = getCharacterRelation('莱特宁');

    expect(relations.counteredBy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '__test_overlay__',
          description: 'legacy overlay relation',
          isMinor: true,
        }),
      ])
    );
  });

  it('should synthesize inverse legacy character links by scanning other character overlays', () => {
    (
      characters['恶魔杰瑞'] as unknown as {
        counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
      }
    ).counteredBy = [
      {
        id: '莱特宁',
        description: 'legacy inverse relation',
        isMinor: true,
      },
    ];

    const relations = getCharacterRelation('莱特宁');

    expect(relations.counters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '恶魔杰瑞',
          description: 'legacy inverse relation',
          isMinor: true,
        }),
      ])
    );
  });

  it('should not rebuild the relation index on repeated read-only relation queries', () => {
    // Trait-backed shared relation data is assumed static during read-only
    // queries. If a future runtime flow starts mutating traits, it must call
    // refreshRelationIndex() explicitly and this expectation should change.
    const initialIndex = getRelationIndex();

    for (let i = 0; i < 5; i += 1) {
      const characterRelations = getCharacterRelation('莱特宁');
      expect(characterRelations.counters.length).toBeGreaterThan(0);
    }

    const summary = getSpecialSkillRelationSummary('应急治疗', 'mouse');
    expect(summary).toHaveProperty('counters');
    expect(summary).toHaveProperty('counteredBy');

    const allSkillRelations = getAllSpecialSkillRelations();
    expect(allSkillRelations.length).toBeGreaterThan(0);

    expect(getRelationIndex()).toBe(initialIndex);
  });
});
