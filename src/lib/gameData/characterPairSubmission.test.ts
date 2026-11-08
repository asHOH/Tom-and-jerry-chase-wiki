import type { Action } from '@/lib/edit/diffUtils';
import { getCharacterRelationTagLabels } from '@/features/characters/utils/characterRelationTags';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';

import { StaleGameDataEditError, validateActionFreshness } from './actionFreshness';
import type { ApprovedCandidateReplayRow } from './approvedCandidateReplay';
import { InvalidGameDataValueError } from './characterDataValidation';
import { createApprovedActionSnapshot } from './published/approvedActionSnapshot';
import { getCanonicalGameData } from './published/canonicalSources';
import { selectPublishedGameData } from './published/selectPublishedDomain';
import { preparePublishActionItems } from './publishPreparation';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('./published/canonicalSources', () => ({ getCanonicalGameData: jest.fn() }));

const relation = { kind: 'counteredBy', description: 'shared note', isMinor: false };
const path = 'A.characterRelationOverrides.B';
const set = (path: string, oldValue: unknown, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue,
  newValue,
});
const row = (...actions: Action[]): ApprovedCandidateReplayRow => ({
  rowId: 'published',
  entityType: 'characters',
  actions,
});

function validate(entries: Action[], currentRows: ApprovedCandidateReplayRow[] = []) {
  const prepared = preparePublishActionItems([{ entityType: 'characters', entries }]);
  validateActionFreshness(
    currentRows,
    prepared.actions.flatMap((item) =>
      item.rows.map((preparedRow, index) => ({
        rowId: `proposed:${index}`,
        entityType: item.entityType,
        actions: preparedRow.actions,
      }))
    )
  );
  return prepared;
}

beforeEach(() => {
  const characters = Object.fromEntries(
    [
      ['A', 'mouse'],
      ['B', 'cat'],
      ['C', 'cat'],
      ['D', 'mouse'],
    ].map(([id, factionId]) => [
      id,
      { id, factionId, description: '', skills: [], knowledgeCardGroups: [] },
    ])
  );
  jest
    .mocked(getCanonicalGameData)
    .mockImplementation(((entityType: string) =>
      entityType === 'characters' ? characters : {}) as typeof getCanonicalGameData);
});

it('accepts the first complete shared record and an explicit removal marker', () => {
  expect(() => validate([set(path, undefined, relation)])).not.toThrow();
  expect(() =>
    validate([set(path, relation, null)], [row(set(path, undefined, relation))])
  ).not.toThrow();
});

it.each([
  ['易伤', '高伤'],
  ['减控', '机制'],
])('accepts replacing saved %s tags in shared and legacy relations', (retired, replacement) => {
  const otherTag = { counters: '免疫', counteredBy: '怕免疫' };
  const before = {
    ...relation,
    tags: [{ counters: retired, counteredBy: `怕${retired}` }, otherTag],
  };
  const after = {
    ...before,
    tags: [{ counters: replacement, counteredBy: `怕${replacement}` }, otherTag],
  };
  const { kind: _beforeKind, ...legacyBefore } = before;
  const { kind: _afterKind, ...legacyAfter } = after;

  for (const [actionPath, oldValue, newValue] of [
    [path, before, after],
    ['A.counteredBy', [{ id: 'B', ...legacyBefore }], [{ id: 'B', ...legacyAfter }]],
  ] as const) {
    const saved = row(set(actionPath, undefined, oldValue));
    const change = set(actionPath, oldValue, newValue);
    const prepared = validate([change], [saved]);

    expect(prepared.actions[0]!.rows[0]!.actions).toEqual([change]);
    expect(saved.actions[0]!.newValue).toEqual(oldValue);
  }
});

it('keeps different pairs independent while rejecting a stale edit to the same pair', () => {
  const otherPath = 'A.characterRelationOverrides.C';
  const prepared = validate([set(path, undefined, relation), set(otherPath, undefined, relation)]);
  expect(prepared.actions[0]!.rows).toHaveLength(2);
  expect(() =>
    validate([set(otherPath, undefined, relation)], [row(set(path, undefined, relation))])
  ).not.toThrow();
  expect(() =>
    validate([set(path, undefined, relation)], [row(set(path, undefined, relation))])
  ).toThrow(StaleGameDataEditError);
});

it.each([
  'characterRelationOverrides',
  'counteredByKnowledgeCards',
  'counteredBySpecialSkills',
] as const)(
  'publishes single-name tags over saved paired tags in %s with exact before-values',
  (field) => {
    const legacyTags = [{ counters: '高伤', counteredBy: '怕高伤' }];
    const actionPath = field === 'characterRelationOverrides' ? path : `A.${field}`;
    const before =
      field === 'characterRelationOverrides'
        ? { ...relation, tags: legacyTags }
        : [{ id: 'target', description: 'before', isMinor: false, tags: legacyTags }];
    const after =
      field === 'characterRelationOverrides'
        ? { ...relation, tags: ['免疫'] }
        : [{ id: 'target', description: 'after', isMinor: false, tags: ['免疫'] }];
    const saved = row(set(actionPath, undefined, before));
    const change = set(actionPath, before, after);
    expect(validate([change], [saved]).actions[0]!.rows[0]!.actions).toEqual([change]);
    const incorrectlyNormalizedBefore =
      field === 'characterRelationOverrides'
        ? { ...relation, tags: ['高伤'] }
        : [{ id: 'target', description: 'before', isMinor: false, tags: ['高伤'] }];
    expect(() => validate([set(actionPath, incorrectlyNormalizedBefore, after)], [saved])).toThrow(
      StaleGameDataEditError
    );

    const snapshot = createApprovedActionSnapshot(
      [saved, row(change)].map((entry, index) => ({
        entityType: entry.entityType,
        decodedRow: { rowId: String(index), rawEntry: null, actions: entry.actions },
      }))
    );
    const published = selectPublishedGameData(
      'characters',
      getCanonicalGameData('characters'),
      snapshot
    );
    const kind = field === 'characterRelationOverrides' ? 'counteredBy' : field;
    const item = getCharacterRelation(published, 'A')[kind][0]!;
    expect(item.tags).toEqual(['免疫']);
    expect(getCharacterRelationTagLabels(item.tags, kind)).toEqual(['怕免疫']);
    expect(saved.actions[0]!.newValue).toEqual(before);
    expect(() =>
      validate([set(actionPath, after, after)], [saved, { ...row(change), rowId: 'updated' }])
    ).toThrow(
      expect.objectContaining({ detail: expect.objectContaining({ reason: 'no_changes' }) })
    );
  }
);

it.each([
  'A.characterRelationOverrides.A',
  'B.characterRelationOverrides.A',
  'A.characterRelationOverrides.Missing',
])('rejects a noncanonical or missing pair endpoint at %s', (invalidPath) => {
  expect(() => validate([set(invalidPath, undefined, relation)])).toThrow(
    InvalidGameDataValueError
  );
});

it.each([
  { ...relation, kind: 'unknown' },
  { ...relation, id: 'B' },
  { ...relation, isMinor: 'true' },
  { ...relation, tags: [{ counters: 'x', counteredBy: 'y', extra: true }] },
])('rejects unsupported shared relation data %#', (value) => {
  expect(() => validate([set(path, undefined, value)])).toThrow(InvalidGameDataValueError);
});

it('enforces faction legality for shared records', () => {
  for (const [invalidPath, value] of [
    [path, { ...relation, kind: 'collaborators' }],
    ['A.characterRelationOverrides.D', relation],
    ['B.characterRelationOverrides.C', relation],
  ] as const) {
    expect(() => validate([set(invalidPath, undefined, value)])).toThrow(InvalidGameDataValueError);
  }
  expect(() =>
    validate([
      set('A.characterRelationOverrides.D', undefined, { ...relation, kind: 'collaborators' }),
    ])
  ).not.toThrow();
});

it('requires complete leaf edits and keeps other missing-parent paths protected', () => {
  expect(() => validate([set('A.characterRelationOverrides', undefined, { B: relation })])).toThrow(
    InvalidGameDataValueError
  );
  expect(() =>
    validate(
      [set(`${path}.description`, 'shared note', 'changed')],
      [row(set(path, undefined, relation))]
    )
  ).toThrow(InvalidGameDataValueError);
  expect(() => validate([set('A.missing.child', undefined, 'value')])).toThrow(
    StaleGameDataEditError
  );
});

it('rejects masked legacy edits after a shared record has become authoritative', () => {
  const current = [row(set(path, undefined, relation))];
  for (const action of [
    set('A.counteredBy', undefined, [{ id: 'B', description: 'stale copy', isMinor: false }]),
    set('B.counters', undefined, [{ id: 'A', description: 'stale copy', isMinor: false }]),
  ]) {
    expect(() => validate([action], current)).toThrow(
      expect.objectContaining({ detail: expect.objectContaining({ reason: 'relation_conflict' }) })
    );
  }
  expect(() => validate([set('B.description', '', 'unrelated prose')], current)).not.toThrow();
  expect(() =>
    validate(
      [set('A.counteredBy', undefined, [{ id: 'C', description: 'another pair', isMinor: false }])],
      current
    )
  ).not.toThrow();
});

it('rejects a mixed legacy and shared write to the same pair in one submission', () => {
  expect(() =>
    validate([
      set(path, undefined, relation),
      set('B.counters', undefined, [{ id: 'A', description: 'competing copy', isMinor: false }]),
    ])
  ).toThrow(InvalidGameDataValueError);
});

it('rejects root replacements that erase or change shared records', () => {
  const before = {
    ...getCanonicalGameData('characters').A!,
    characterRelationOverrides: { B: relation },
  };
  const current = [row(set(path, undefined, relation))];
  expect(() =>
    validate([set('A', before, { ...before, characterRelationOverrides: {} })], current)
  ).toThrow(InvalidGameDataValueError);
  expect(() =>
    validate([set('A', before, { ...before, description: 'unrelated prose' })], current)
  ).not.toThrow();
});
