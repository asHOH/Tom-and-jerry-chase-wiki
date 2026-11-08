import { validateCharacterData } from '@/lib/gameData/characterDataValidation';
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

it('projects retired shared tags in both views and records edits with the original before-value', () => {
  window.localStorage.clear();
  const before = {
    kind: 'counters' as const,
    description: '原说明',
    isMinor: false,
    tags: [{ counters: '免疫', counteredBy: '怕免疫' }],
  };
  Object.assign(characters['图多盖洛']!, { characterRelationOverrides: { 泰菲: before } });
  const session = installTestEditSession({ characters });
  const scope = {
    kind: 'entity',
    entity: { entityType: 'characters', entityId: '泰菲' },
  } as const;
  try {
    const read = () => session.readDomain('characters');
    for (const [id, kind, targetId] of [
      ['图多盖洛', 'counters', '泰菲'],
      ['泰菲', 'counteredBy', '图多盖洛'],
    ] as const) {
      expect(
        getCharacterRelation(read(), id)[kind].find((item) => item.id === targetId)?.tags
      ).toEqual(['免控']);
      expect(
        getEditableCharacterRelations(read(), id)[kind].find((item) => item.id === targetId)?.tags
      ).toEqual(['免控']);
    }
    session.updateDomain('characters', (draft) => {
      updateCharacterRelationTags(draft, '泰菲', 'counteredBy', '图多盖洛', ['免控']);
    });
    expect(session.readDraft(scope).actionCount).toBe(0);
    session.updateDomain('characters', (draft) => {
      toggleCharacterRelationMinor(draft, '泰菲', 'counteredBy', '图多盖洛');
    });
    expect(session.readDraft(scope).publishEntries).toEqual([
      expect.objectContaining({
        path: '图多盖洛.characterRelationOverrides.泰菲',
        oldValue: before,
        newValue: { ...before, isMinor: true, tags: ['免控'] },
      }),
    ]);
    expect(before.tags).toEqual([{ counters: '免疫', counteredBy: '怕免疫' }]);
  } finally {
    clearTestEditSession(session);
    window.localStorage.clear();
  }
});

it('migrates the legacy skill collection on a real edit and preserves descriptions and later tag choices', () => {
  const before = [
    {
      id: '我生气了！',
      isMinor: false,
      description: '解控说明',
      tags: [{ counters: '机制', counteredBy: '怕机制' }],
    },
    { id: '蓄力重击', isMinor: false, description: '干扰说明', tags: ['免疫', '干扰'] },
    { id: '绝地反击', isMinor: true, description: '已批准说明', tags: ['机制'] },
  ];
  Object.assign(characters['泰菲']!, { countersSpecialSkills: structuredClone(before) });
  expect(
    getEditableCharacterRelations(characters, '泰菲').countersSpecialSkills.map((item) => item.tags)
  ).toEqual([['免控'], ['免控', '干扰'], ['机制']]);
  updateCharacterRelationTags(characters, '泰菲', 'countersSpecialSkills', '我生气了！', ['免控']);
  expect((characters['泰菲'] as Partial<CharacterRelation>).countersSpecialSkills).toEqual(before);
  toggleCharacterRelationMinor(characters, '泰菲', 'countersSpecialSkills', '我生气了！');
  const stored = (characters['泰菲'] as Partial<CharacterRelation>).countersSpecialSkills!;
  expect(stored.map((item) => item.description)).toEqual(before.map((item) => item.description));
  expect(stored.map((item) => item.tags)).toEqual([['免控'], ['免控', '干扰'], ['机制']]);
  updateCharacterRelationTags(characters, '泰菲', 'countersSpecialSkills', '我生气了！', ['机制']);
  expect(getCharacterRelation(characters, '泰菲').countersSpecialSkills[0]?.tags).toEqual(['机制']);
});

it.each(['remove', 'move'] as const)(
  'migrates retained legacy skill tags when an editor performs %s',
  (operation) => {
    Object.assign(characters['泰菲']!, {
      countersSpecialSkills: [
        { id: '我生气了！', isMinor: false, tags: [{ counters: '机制', counteredBy: '怕机制' }] },
        { id: '蓄力重击', isMinor: false, description: '保留说明', tags: ['免疫', '干扰'] },
      ],
    });
    if (operation === 'remove') {
      removeCharacterRelationItem(characters, '泰菲', 'countersSpecialSkills', '我生气了！');
    } else {
      upsertCharacterRelationItem(characters, '泰菲', 'counteredBySpecialSkills', {
        id: '我生气了！',
        isMinor: false,
        tags: ['免控'],
      });
    }
    expect((characters['泰菲'] as Partial<CharacterRelation>).countersSpecialSkills).toEqual([
      { id: '蓄力重击', isMinor: false, description: '保留说明', tags: ['免控', '干扰'] },
    ]);
    expect(() => validateCharacterData(characters, ['泰菲.countersSpecialSkills'])).not.toThrow();
  }
);

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

  it('keeps a legacy tag selection unchanged and writes canonical tags for a real edit', () => {
    const legacy = {
      kind: 'counters' as const,
      description: 'saved note',
      isMinor: false,
      tags: [{ counters: '高伤', counteredBy: '怕高伤' }],
    };
    characters.Cat!.characterRelationOverrides = { Mouse: legacy };
    updateCharacterRelationTags(characters, 'Mouse', 'counteredBy', 'Cat', ['高伤']);
    expect(characters.Cat!.characterRelationOverrides.Mouse).toBe(legacy);
    updateCharacterRelationTags(characters, 'Mouse', 'counteredBy', 'Cat', ['免控']);
    expect(characters.Cat!.characterRelationOverrides.Mouse).toEqual({ ...legacy, tags: ['免控'] });
    expect(getCharacterRelation(characters, 'Mouse').counteredBy[0]!.tags).toEqual(['免控']);
    expect(legacy.tags).toEqual([{ counters: '高伤', counteredBy: '怕高伤' }]);
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
          tags: ['拉扯'],
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
