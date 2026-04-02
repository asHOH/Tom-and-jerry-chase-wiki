import { characters } from '@/data';

import { getCharacterRelation } from './relations';

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
});
