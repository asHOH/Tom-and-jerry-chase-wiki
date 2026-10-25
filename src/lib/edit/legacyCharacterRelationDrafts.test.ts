import type { CharacterGameData } from '@/lib/dataManager';
import {
  validateCharacterData,
  validateCharacterRelationEditSources,
} from '@/lib/gameData/characterDataValidation';
import { getOrCreatePublishOperationId } from '@/lib/gameData/publishOperation';
import { updateCharacterRelationDescription } from '@/features/characters/utils/characterRelationOverlay';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';
import {
  clearTestEditSession,
  getTestEditHistoryKey,
  installTestEditSession,
  readTestEditHistory,
  writeTestEditHistory,
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
    writeTestEditHistory(key, [
      set('A.counters', undefined, characterId === 'B' ? [item('B'), item('C')] : [item('B')]),
    ]);
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
      json: async () => ({ result: [{ is_public: true, status: 'approved' }] }),
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
  writeTestEditHistory(key, [
    set('A.counters', undefined, [item('B'), item('C')]),
    set('A.description', '', 'unrelated prose'),
    set('A.advantageMaps', undefined, [item('Map')]),
  ]);
  session = installTestEditSession({ characters: baseline });
  expect(session.discardDraft(scope('B'))).toEqual({ status: 'discarded' });
  expect(
    readTestEditHistory(key)
      .flat()
      .map(({ path }) => path)
  ).toEqual(['A.characterRelationOverrides.C', 'A.description', 'A.advantageMaps']);
  expect(getCharacterRelation(session.readDomain('characters'), 'A').counters).toEqual([item('C')]);
});

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

it('preserves an unresolved legacy submission and its operation identity during restore', () => {
  const history = [set('A.counters', undefined, [item('B')])];
  writeTestEditHistory(key, history);
  const operationId = getOrCreatePublishOperationId('page:characters:A', 'original request');
  session = installTestEditSession({ characters: baseline });
  expect(readTestEditHistory(key)).toEqual(history);
  expect(session.readDraft(scope('A')).publishEntries).toEqual(history);
  expect(getOrCreatePublishOperationId('page:characters:A', 'original request')).toBe(operationId);
});
