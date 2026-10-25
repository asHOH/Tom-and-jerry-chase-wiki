import { characters as canonicalCharacters } from '@/data/static';
import type { CharacterRelation } from '@/data/types';
import { clearTestEditSession, installTestEditSession } from '@/testUtils/editRuntime';

import {
  addCharacterRelationItem,
  createCharacterRelationItem,
  getCharacterRelationDescriptionPath,
  getEditableCharacterRelations,
  removeCharacterRelationItem,
  toggleCharacterRelationMinor,
  updateCharacterRelationDescription,
  updateCharacterRelationTags,
  upsertCharacterRelationItem,
} from './characterRelationOverlay';
import { getCharacterRelationPairLocation } from './characterRelationPairs';
import { getCharacterRelation } from './relationReadModel';

let characters = structuredClone(canonicalCharacters);

beforeEach(() => {
  characters = structuredClone(canonicalCharacters);
});

it('keeps non-character relations in their existing collections', () => {
  expect(getCharacterRelationDescriptionPath('advantageMaps', 2)).toBe('advantageMaps.2');
  addCharacterRelationItem(
    characters,
    '莱特宁',
    'advantageMaps',
    createCharacterRelationItem('Map')
  );
  updateCharacterRelationDescription(characters, '莱特宁', 'advantageMaps', 'Map', '  note  ');
  toggleCharacterRelationMinor(characters, '莱特宁', 'advantageMaps', 'Map');
  expect((characters['莱特宁'] as Partial<CharacterRelation>).advantageMaps).toEqual(
    expect.arrayContaining([{ id: 'Map', description: 'note', isMinor: true }])
  );
  upsertCharacterRelationItem(characters, '莱特宁', 'disadvantageMaps', {
    id: 'Map',
    description: 'changed kind',
    isMinor: false,
  });
  expect(
    getCharacterRelation(characters, '莱特宁').advantageMaps.some(({ id }) => id === 'Map')
  ).toBe(false);
  removeCharacterRelationItem(characters, '莱特宁', 'disadvantageMaps', 'Map');
  expect(
    getCharacterRelation(characters, '莱特宁').disadvantageMaps.some(({ id }) => id === 'Map')
  ).toBe(false);
});

it('clears both directions when removing a conflicting non-character draft', () => {
  Object.assign(characters['莱特宁']!, {
    advantageMaps: [{ id: 'Map', description: 'advantage', isMinor: false }],
    disadvantageMaps: [
      { id: 'Map', description: 'disadvantage', isMinor: false },
      { id: 'OtherMap', description: 'keep', isMinor: true },
    ],
  });
  removeCharacterRelationItem(characters, '莱特宁', 'advantageMaps', 'Map');
  const remaining = getEditableCharacterRelations(characters, '莱特宁');
  expect(remaining.advantageMaps).toEqual([]);
  expect(remaining.disadvantageMaps).toEqual([
    { id: 'OtherMap', description: 'keep', isMinor: true },
  ]);
});

it('keeps invalid legacy items visible for correction in the editor', () => {
  expect(
    getEditableCharacterRelations(characters, '莱特宁', {
      counteredBy: [{ id: '__overlay_only__', description: 'overlay', isMinor: true }],
    }).counteredBy
  ).toEqual([{ id: '__overlay_only__', description: 'overlay', isMinor: true }]);
});

it('removes a legacy pair from both views even when both characters own copies', () => {
  const left = '莱特宁';
  const right = '表演者•杰瑞';
  Object.assign(characters[left]!, {
    counteredBy: [{ id: right, description: 'left legacy', isMinor: false }],
  });
  Object.assign(characters[right]!, {
    counters: [{ id: left, description: 'right legacy', isMinor: true }],
  });
  const beforeOtherPairs = getCharacterRelation(characters, left).counteredBy.filter(
    ({ id }) => id !== right
  );

  removeCharacterRelationItem(characters, left, 'counteredBy', right);

  expect(getCharacterRelation(characters, left).counteredBy).toEqual(beforeOtherPairs);
  expect(
    getEditableCharacterRelations(characters, left).counteredBy.some(({ id }) => id === right)
  ).toBe(false);
  expect(getCharacterRelation(characters, right).counters.some(({ id }) => id === left)).toBe(
    false
  );
  const pair = getCharacterRelationPairLocation(left, right);
  expect(characters[pair.ownerId]?.characterRelationOverrides?.[pair.otherId]).toBeNull();
});

describe('shared pair records and inferred suggestions', () => {
  beforeEach(() => {
    characters = {
      Cat: { ...canonicalCharacters['汤姆']!, id: 'Cat', counterTags: ['拉扯'] },
      Mouse: { ...canonicalCharacters['杰瑞']!, id: 'Mouse', counterTags: ['怕拉扯'] },
      OtherMouse: { ...canonicalCharacters['杰瑞']!, id: 'OtherMouse', counterTags: ['怕拉扯'] },
    };
  });

  it('keeps unchanged saves and absent removals out of stored relations', () => {
    const displayed = getEditableCharacterRelations(characters, 'Cat').counters[0]!;
    updateCharacterRelationDescription(
      characters,
      'Cat',
      'counters',
      'Mouse',
      displayed.description!
    );
    updateCharacterRelationTags(characters, 'Cat', 'counters', 'Mouse', displayed.tags);
    upsertCharacterRelationItem(characters, 'Cat', 'counters', displayed);
    removeCharacterRelationItem(characters, 'Cat', 'counters', 'Missing');
    expect(characters.Cat?.characterRelationOverrides).toBeUndefined();
    expect(characters.Mouse?.characterRelationOverrides).toBeUndefined();
  });

  it('promotes only the selected suggestion and shares all metadata from either endpoint', () => {
    updateCharacterRelationDescription(characters, 'Cat', 'counters', 'Mouse', 'Shared note');
    toggleCharacterRelationMinor(characters, 'Mouse', 'counteredBy', 'Cat');
    updateCharacterRelationTags(characters, 'Mouse', 'counteredBy', 'Cat', []);

    expect(characters.Cat?.characterRelationOverrides).toEqual({
      Mouse: { kind: 'counters', description: 'Shared note', isMinor: true },
    });
    expect(characters.Mouse?.characterRelationOverrides).toBeUndefined();
    expect(getCharacterRelation(characters, 'Cat').counters).toEqual(
      expect.arrayContaining([
        { id: 'Mouse', description: 'Shared note', isMinor: true },
        expect.objectContaining({
          id: 'OtherMouse',
          tags: [{ counters: '拉扯', counteredBy: '怕拉扯' }],
        }),
      ])
    );
    expect(getCharacterRelation(characters, 'Mouse').counteredBy).toEqual([
      { id: 'Cat', description: 'Shared note', isMinor: true },
    ]);
  });

  it('stores reverse edits under the same owner and switches relation kinds in both views', () => {
    upsertCharacterRelationItem(characters, 'Mouse', 'counteredBy', {
      id: 'Cat',
      description: 'first',
      isMinor: false,
    });
    upsertCharacterRelationItem(characters, 'Mouse', 'counterEachOther', {
      id: 'Cat',
      description: 'mutual',
      isMinor: true,
    });
    const record = characters.Cat?.characterRelationOverrides?.Mouse;
    upsertCharacterRelationItem(characters, 'Cat', 'counterEachOther', {
      id: 'Mouse',
      description: 'mutual',
      isMinor: true,
    });

    expect(characters.Cat?.characterRelationOverrides?.Mouse).toBe(record);
    expect(getCharacterRelation(characters, 'Cat').counterEachOther).toEqual([
      { id: 'Mouse', description: 'mutual', isMinor: true },
    ]);
    expect(getCharacterRelation(characters, 'Mouse').counterEachOther).toEqual([
      { id: 'Cat', description: 'mutual', isMinor: true },
    ]);
    expect(getCharacterRelation(characters, 'Cat').counters.map(({ id }) => id)).toEqual([
      'OtherMouse',
    ]);
    expect(getCharacterRelation(characters, 'Mouse').counteredBy).toEqual([]);
  });

  it('removes an inferred pair deliberately while preserving other suggestions', () => {
    removeCharacterRelationItem(characters, 'Mouse', 'counteredBy', 'Cat');
    expect(characters.Cat?.characterRelationOverrides).toEqual({ Mouse: null });
    expect(getCharacterRelation(characters, 'Cat').counters.map(({ id }) => id)).toEqual([
      'OtherMouse',
    ]);
    expect(getCharacterRelation(characters, 'Mouse').counteredBy).toEqual([]);
  });

  it('adds one explicit pair without copying other inferred pairs', () => {
    addCharacterRelationItem(
      characters,
      'Cat',
      'counters',
      createCharacterRelationItem('OtherMouse')
    );
    expect(characters.Cat?.characterRelationOverrides).toEqual({
      OtherMouse: { kind: 'counters', description: '', isMinor: false },
    });
    expect(
      getEditableCharacterRelations(characters, 'Cat')
        .counters.map(({ id }) => id)
        .sort()
    ).toEqual(['Mouse', 'OtherMouse']);
  });

  it('preserves explicit metadata instead of storing derived tags during a description edit', () => {
    Object.assign(characters.Cat!, {
      counters: [{ id: 'Mouse', description: 'Explicit note', isMinor: true }],
    });
    const displayed = getCharacterRelation(characters, 'Cat').counters[0]!;
    expect(displayed.tags).toHaveLength(1);
    upsertCharacterRelationItem(characters, 'Cat', 'counters', displayed);
    expect(characters.Cat?.characterRelationOverrides).toBeUndefined();
    updateCharacterRelationDescription(characters, 'Cat', 'counters', 'Mouse', 'Updated note');
    expect(characters.Cat?.characterRelationOverrides).toEqual({
      Mouse: { kind: 'counters', description: 'Updated note', isMinor: true },
    });
  });

  it('restores and discards the same single-record draft from the opposite character', async () => {
    window.localStorage.clear();
    const scope = {
      kind: 'entity',
      entity: { entityType: 'characters', entityId: 'Mouse' },
    } as const;
    let session = installTestEditSession({ characters });
    try {
      session.updateDomain('characters', (draft) => {
        updateCharacterRelationDescription(draft, 'Cat', 'counters', 'Mouse', 'Verified note');
      });
      await Promise.resolve();
      const publishedEntries = session.readDraft(scope).publishEntries;
      expect(publishedEntries).toEqual([
        expect.objectContaining({
          path: 'Cat.characterRelationOverrides.Mouse',
          newValue: expect.objectContaining({ kind: 'counters', description: 'Verified note' }),
        }),
      ]);
      clearTestEditSession(session);
      session = installTestEditSession({ characters });
      expect(session.readDraft(scope).publishEntries).toEqual(publishedEntries);
      expect(session.discardDraft(scope)).toEqual({ status: 'discarded' });
      expect(session.readDraft(scope).actionCount).toBe(0);
      expect(getCharacterRelation(session.readDomain('characters'), 'Cat').counters).toHaveLength(
        2
      );
    } finally {
      clearTestEditSession(session);
      window.localStorage.clear();
    }
  });
});
