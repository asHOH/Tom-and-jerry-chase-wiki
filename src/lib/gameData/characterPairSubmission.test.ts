import type { Action } from '@/lib/edit/diffUtils';

import { StaleGameDataEditError, validateActionFreshness } from './actionFreshness';
import type { ApprovedCandidateReplayRow } from './approvedCandidateReplay';
import { InvalidGameDataValueError } from './characterDataValidation';
import { getCanonicalGameData } from './published/canonicalSources';
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
