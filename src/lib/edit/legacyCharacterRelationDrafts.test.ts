import type { CharacterGameData } from '@/lib/dataManager';
import {
  validateCharacterData,
  validateCharacterRelationEditSources,
} from '@/lib/gameData/characterDataValidation';
import { getOrCreatePublishOperationId } from '@/lib/gameData/publishOperation';
import { characters as canonicalCharacters } from '@/data/static';
import { updateCharacterRelationDescription } from '@/features/characters/utils/characterRelationOverlay';
import {
  getCharacterRelation,
  getExplicitCharacterRelation,
} from '@/features/characters/utils/relationReadModel';
import {
  clearTestEditSession,
  getTestEditHistoryKey,
  installTestEditSession,
  readTestEditHistory,
} from '@/testUtils/editRuntime';

import { applyActionEntry, type Action, type ActionHistoryEntry } from './diffUtils';
import type { EditSession } from './editSession';
import { migrateLegacyCharacterRelationDrafts } from './legacyCharacterRelationDrafts';

const item = (id: string, description = 'legacy note') => ({ id, description, isMinor: false });
const set = (path: string, oldValue: unknown, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue,
  newValue,
});
const baseline = Object.fromEntries(
  [
    ['A', 'cat'],
    ['B', 'mouse'],
    ['C', 'mouse'],
  ].map(([id, factionId]) => [
    id,
    {
      id,
      name: id,
      factionId,
      description: '',
      skills: [],
      knowledgeCardGroups: [],
      createDate: null,
    },
  ])
) as CharacterGameData;
const key = getTestEditHistoryKey('characters');
const scope = (entityId: string) =>
  ({ kind: 'entity', entity: { entityType: 'characters', entityId } }) as const;
let session: EditSession | undefined;

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

it('does not promote unchanged baseline pairs when restoring a legacy tag collection', () => {
  const characters = structuredClone(canonicalCharacters);
  const items = getExplicitCharacterRelation(characters, '魔术师').counters;
  expect(items.some((item) => item.tags?.length)).toBe(true);
  const legacy = items.map((item) => ({
    ...item,
    ...(item.tags
      ? {
          tags: item.tags.map((tag) =>
            typeof tag === 'string' ? { counters: tag, counteredBy: `怕${tag}` } : tag
          ),
        }
      : {}),
  }));
  expect(
    migrateLegacyCharacterRelationDrafts([set('魔术师.counters', undefined, legacy)], characters)
  ).toEqual([]);
});

it.each(['剑客杰瑞', '恶魔汤姆'])(
  'restores retired immunity tags for %s without creating unrelated edits',
  (characterId) => {
    const characters = structuredClone(canonicalCharacters);
    const items = getExplicitCharacterRelation(characters, characterId).counters;
    const targetId = characterId === '剑客杰瑞' ? '牛仔汤姆' : '罗宾汉杰瑞';
    const legacy = items.map((item) =>
      item.id === targetId ? { ...item, tags: [{ counters: '免疫', counteredBy: '怕免疫' }] } : item
    );
    const history = [set(`${characterId}.counters`, undefined, legacy)];
    expect(migrateLegacyCharacterRelationDrafts(history, characters)).toEqual([]);
    const changed = legacy.map((item) =>
      item.id === targetId ? { ...item, description: '编辑后的说明' } : item
    );
    const result = migrateLegacyCharacterRelationDrafts(
      [set(`${characterId}.counters`, undefined, changed)],
      characters
    );
    expect(result.flat()).toHaveLength(1);
    expect(result.flat()[0]?.newValue).toMatchObject({ description: '编辑后的说明' });
    expect(JSON.stringify(result)).not.toContain('免疫');
    expect(history[0]?.newValue).toEqual(legacy);
  }
);

afterEach(() => {
  if (session) clearTestEditSession(session);
  session = undefined;
  window.localStorage.clear();
  window.sessionStorage.clear();
  jest.restoreAllMocks();
});

it.each(['A', 'B'])(
  'restores, edits, and publishes one shared record from %s',
  async (characterId) => {
    window.localStorage.setItem(
      key,
      JSON.stringify([
        set('A.counters', undefined, characterId === 'B' ? [item('B'), item('C')] : [item('B')]),
      ])
    );
    session = installTestEditSession({ characters: baseline });
    session.updateDomain('characters', (characters) => {
      updateCharacterRelationDescription(
        characters,
        characterId,
        characterId === 'A' ? 'counters' : 'counteredBy',
        characterId === 'A' ? 'B' : 'A',
        'revised note'
      );
    });
    await Promise.resolve();
    const entries = session.readDraft(scope(characterId)).publishEntries;
    expect(entries).toEqual([
      set('A.characterRelationOverrides.B', undefined, {
        kind: 'counters',
        description: 'revised note',
        isMinor: false,
      }),
    ]);
    const published = structuredClone(baseline);
    entries.forEach((entry) => applyActionEntry(published, entry));
    expect(() =>
      validateCharacterData(
        published,
        entries.flat().map(({ path }) => path)
      )
    ).not.toThrow();
    expect(() =>
      validateCharacterRelationEditSources(
        baseline,
        published,
        entries.flat().map(({ path }) => path)
      )
    ).not.toThrow();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: [{ id: 'action-1', is_public: true, status: 'approved' }] }),
    });
    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
      expect(await session.publishDraft(scope(characterId))).toMatchObject({ status: 'published' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(session.readDraft(scope('A')).actionCount).toBe(characterId === 'B' ? 1 : 0);
      expect(session.readDraft(scope('B')).actionCount).toBe(0);
      if (characterId === 'B') {
        expect(session.readDraft(scope('C')).publishEntries.flat()).toEqual([
          expect.objectContaining({ path: 'A.characterRelationOverrides.C' }),
        ]);
      }
    } finally {
      global.fetch = originalFetch;
    }
  }
);

it('discards one restored target from the opposite endpoint while preserving another target and prose', () => {
  window.localStorage.setItem(
    key,
    JSON.stringify([
      set('A.counters', undefined, [item('B'), item('C')]),
      set('A.description', '', 'unrelated prose'),
      set('A.advantageMaps', undefined, [item('Map')]),
    ])
  );
  session = installTestEditSession({ characters: baseline });
  expect(session.discardDraft(scope('B'))).toEqual({ status: 'discarded' });
  expect(
    readTestEditHistory(key)
      .flat()
      .map(({ path }) => path)
  ).toEqual(['A.characterRelationOverrides.C', 'A.description', 'A.advantageMaps']);
  expect(getCharacterRelation(session.readDomain('characters'), 'A').counters).toEqual([item('C')]);
});

it.each([['高伤'], [{ counters: '高伤', counteredBy: '怕高伤' }]])(
  'restores collection drafts with tag format %j into a publishable shared record',
  (tag) => {
    const tags = [tag];
    const before = { ...item('B'), tags };
    window.localStorage.setItem(key, JSON.stringify([set('A.counters', undefined, [before])]));
    session = installTestEditSession({ characters: baseline });
    const entries = session.readDraft(scope('B')).publishEntries;
    expect(entries).toEqual([
      set('A.characterRelationOverrides.B', undefined, {
        kind: 'counters',
        description: 'legacy note',
        isMinor: false,
        tags,
      }),
    ]);
    const published = structuredClone(baseline);
    entries.forEach((entry) => applyActionEntry(published, entry));
    expect(() =>
      validateCharacterData(
        published,
        entries.flat().map(({ path }) => path)
      )
    ).not.toThrow();
  }
);

it('retains deletion intent despite an inverse legacy copy', () => {
  const characters = structuredClone(baseline);
  Object.assign(characters.A!, { counters: [item('B')] });
  Object.assign(characters.B!, { counteredBy: [item('A')] });
  expect(
    migrateLegacyCharacterRelationDrafts([set('A.counters', [item('B')], [])], characters)
  ).toEqual([set('A.characterRelationOverrides.B', undefined, null)]);
});

it('uses the explicit fallback for first-write removals and unchanged collections', () => {
  const characters = structuredClone(baseline);
  Object.assign(characters.B!, { counteredBy: [item('A')] });
  expect(
    migrateLegacyCharacterRelationDrafts([set('A.counters', undefined, [])], characters)
  ).toEqual([set('A.characterRelationOverrides.B', undefined, null)]);
  expect(
    migrateLegacyCharacterRelationDrafts([set('A.counters', undefined, [item('B')])], characters)
  ).toEqual([]);
});

it('preserves removal of a whole overlay because that restores its baseline fallback', () => {
  const characters = structuredClone(baseline);
  Object.assign(characters.A!, { counters: [item('B')] });
  for (const op of ['delete', 'set'] as const) {
    const history = [{ op, path: 'A.counters', oldValue: [item('B')], newValue: undefined }];
    expect(migrateLegacyCharacterRelationDrafts(history, characters)).toBe(history);
  }
});

it('keeps a replacement kind when the old kind is subsequently cleared', () => {
  const characters = structuredClone(baseline);
  Object.assign(characters.A!, { counters: [item('B')] });
  expect(
    migrateLegacyCharacterRelationDrafts(
      [set('A.counterEachOther', undefined, [item('B')]), set('A.counters', [item('B')], [])],
      characters
    ).flat()
  ).toEqual([
    set('A.characterRelationOverrides.B', undefined, {
      kind: 'counterEachOther',
      description: 'legacy note',
      isMinor: false,
    }),
  ]);
});

it('rebases a later shared edit onto the converted legacy record', () => {
  const previous = { kind: 'counters', description: 'legacy note', isMinor: false };
  const next = { ...previous, description: 'new note' };
  expect(
    migrateLegacyCharacterRelationDrafts(
      [
        set('A.counters', undefined, [item('B')]),
        set('A.characterRelationOverrides.B', undefined, next),
      ],
      baseline
    ).flat()
  ).toEqual([
    set('A.characterRelationOverrides.B', undefined, previous),
    set('A.characterRelationOverrides.B', previous, next),
  ]);
});

it.each([
  [set('A.counters', [item('B', 'stale')], [item('B')])],
  [set('A.counters.0.description', 'old', 'new')],
  [set('A.counters', undefined, [{ ...item('B'), extra: true }])],
  [set('A.counters', undefined, null)],
  [set('A', baseline.A, { ...baseline.A, counters: [item('B')] })],
])('preserves a stale or unsupported legacy draft unchanged %#', (...entries) => {
  const history = entries as ActionHistoryEntry[];
  expect(migrateLegacyCharacterRelationDrafts(history, baseline)).toBe(history);
});

it('preserves a legacy draft when its pair already has a published shared record', () => {
  const characters = structuredClone(baseline);
  characters.A!.characterRelationOverrides = { B: null };
  const history = [set('A.counters', undefined, [item('B')])];
  expect(migrateLegacyCharacterRelationDrafts(history, characters)).toBe(history);
});

it('restores a shared-pair immunity draft with its exact published before-value', () => {
  const characters = structuredClone(baseline);
  const before = {
    kind: 'counters' as const,
    isMinor: false,
    description: '原说明',
    tags: [{ counters: '免疫', counteredBy: '怕免疫' }],
  };
  characters.A!.characterRelationOverrides = { B: before };
  const history = [set('A.characterRelationOverrides.B', before, { ...before, isMinor: true })];
  window.localStorage.setItem(key, JSON.stringify(history));
  session = installTestEditSession({ characters });
  const entries = session.readDraft(scope('A')).publishEntries;
  expect(entries).toEqual([
    set('A.characterRelationOverrides.B', before, { ...before, isMinor: true, tags: ['免控'] }),
  ]);
  expect(() =>
    validateCharacterData(session!.readDomain('characters'), ['A.characterRelationOverrides.B'])
  ).not.toThrow();
  expect(history[0]?.oldValue).toEqual(before);
});

it('restores a skill-list immunity draft while preserving its descriptions', () => {
  const values = [
    {
      id: '我生气了！',
      isMinor: false,
      description: '解控说明',
      tags: [{ counters: '机制', counteredBy: '怕机制' }],
    },
    { id: '蓄力重击', isMinor: false, description: '干扰说明', tags: ['免疫', '干扰'] },
  ];
  window.localStorage.setItem(
    key,
    JSON.stringify([set('泰菲.countersSpecialSkills', undefined, values)])
  );
  session = installTestEditSession({ characters: structuredClone(canonicalCharacters) });
  expect(session.readDraft(scope('泰菲')).publishEntries).toEqual([
    set('泰菲.countersSpecialSkills', undefined, [
      { ...values[0], tags: ['免控'] },
      { ...values[1], tags: ['免控', '干扰'] },
    ]),
  ]);
  expect(() =>
    validateCharacterData(session!.readDomain('characters'), ['泰菲.countersSpecialSkills'])
  ).not.toThrow();
});

it('preserves stale non-character drafts instead of rebasing their before-values', () => {
  const characters = structuredClone(baseline);
  const oldValue = [{ id: 'skill', isMinor: false, description: '旧说明', tags: ['免疫'] }];
  Object.assign(characters.A!, {
    countersSpecialSkills: [{ ...oldValue[0], description: '已发布的新说明' }],
  });
  const history = [set('A.countersSpecialSkills', oldValue, [{ ...oldValue[0], isMinor: true }])];
  expect(migrateLegacyCharacterRelationDrafts(history, characters)).toBe(history);
});

it.each([
  set('A.counters', undefined, [item('B')]),
  set('A.characterRelationOverrides.B', undefined, {
    kind: 'counters',
    isMinor: false,
    tags: ['免疫'],
  }),
  set('A.countersSpecialSkills', undefined, [{ id: 'skill', isMinor: false, tags: ['免疫'] }]),
])('preserves an unresolved submission and its operation identity during restore %#', (entry) => {
  const history = [entry];
  window.localStorage.setItem(key, JSON.stringify(history));
  const operationId = getOrCreatePublishOperationId('page:characters:A', 'original request');
  session = installTestEditSession({ characters: baseline });
  expect(readTestEditHistory(key)).toEqual(history);
  expect(session.readDraft(scope('A')).publishEntries).toEqual(history);
  expect(getOrCreatePublishOperationId('page:characters:A', 'original request')).toBe(operationId);
});
