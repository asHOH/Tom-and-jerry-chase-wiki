import { characterRelationTraits } from '@/data/characterRelations';
import type { CharacterRelation, TraitRelation } from '@/data/types';
import { getRelationIndex } from '@/features/shared/traits/relationIndex';
import { characters } from '@/data';

import {
  getAllSpecialSkillRelations,
  getCharacterRelation,
  getSpecialSkillRelationSummary,
} from './relationReadModel';

const cloneCharacters = () => structuredClone(characters);

const restoreCharacters = (snapshot: Record<string, unknown>) => {
  Object.keys(characters).forEach((key) => {
    delete (characters as Record<string, unknown>)[key];
  });

  Object.entries(snapshot).forEach(([key, value]) => {
    (characters as Record<string, unknown>)[key] = structuredClone(value);
  });
};

const setLegacyRelationItems = (
  id: string,
  key: keyof Pick<
    CharacterRelation,
    'collaborators' | 'counterEachOther' | 'counteredBy' | 'counters'
  >,
  items: CharacterRelation[keyof CharacterRelation]
) => {
  (characters[id] as Partial<CharacterRelation>)[key] = items;
};

const findSharedCharacterRelation = (
  kind: 'collaborators' | 'counterEachOther' | 'counteredBy' | 'counters'
): TraitRelation => {
  const relation = characterRelationTraits.find(
    (trait): trait is typeof trait & { relation: TraitRelation } =>
      trait.relation?.kind === kind &&
      trait.relation.subject.type === 'character' &&
      trait.relation.target.type === 'character' &&
      trait.relation.subject.name in characters &&
      trait.relation.target.name in characters
  )?.relation;

  if (!relation) {
    throw new Error(`Missing shared character relation fixture for ${kind}.`);
  }

  return relation;
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

  it('should let page-local overlays override duplicate shared relation entries by id', () => {
    const relation = findSharedCharacterRelation('counters');
    const overlayItem = {
      id: relation.target.name,
      description: 'legacy overlay wins duplicate shared edge',
      isMinor: true,
    };

    setLegacyRelationItems(relation.subject.name, 'counters', [overlayItem]);

    const relations = getCharacterRelation(relation.subject.name);
    const matches = relations.counters.filter((item) => item.id === relation.target.name);

    expect(matches).toEqual([overlayItem]);
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

  it('should dedupe direct and synthesized legacy entries for the same character id', () => {
    const relation = findSharedCharacterRelation('counters');
    const directItem = {
      id: relation.subject.name,
      description: 'direct legacy relation wins synthesized inverse duplicate',
      isMinor: false,
    };

    setLegacyRelationItems(relation.target.name, 'counteredBy', [directItem]);
    setLegacyRelationItems(relation.subject.name, 'counters', [
      {
        id: relation.target.name,
        description: 'synthesized inverse duplicate',
        isMinor: true,
      },
    ]);

    const relations = getCharacterRelation(relation.target.name);
    const matches = relations.counteredBy.filter((item) => item.id === relation.subject.name);

    expect(matches).toEqual([directItem]);
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
