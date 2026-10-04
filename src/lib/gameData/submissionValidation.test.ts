import {
  getCharacterRelation,
  getExplicitCharacterRelation,
} from '@/features/characters/utils/relationReadModel';

import { validateActionFreshness } from './actionFreshness';
import type { ApprovedCandidateReplayRow } from './approvedCandidateReplay';
import { InvalidGameDataValueError } from './characterDataValidation';
import { getCanonicalGameData } from './published/canonicalSources';
import { preparePublishActionItems } from './publishPreparation';

jest.mock('server-only', () => ({}), { virtual: true });

// Exercise real preparation, canonical data, replay, and validation without database writes.
function validate(entries: unknown[], currentRows: readonly ApprovedCandidateReplayRow[] = []) {
  const prepared = preparePublishActionItems([{ entityType: 'characters', entries }]);
  validateActionFreshness(
    currentRows,
    prepared.actions.flatMap((item) =>
      item.rows.map((row, index) => ({
        rowId: `proposed:${index}`,
        entityType: item.entityType,
        actions: row.actions,
      }))
    )
  );
}

const add = (path: string, newValue: unknown) => ({ op: 'add', path, newValue });
const set = (path: string, oldValue: unknown, newValue: unknown) => ({
  op: 'set' as const,
  path,
  oldValue,
  newValue,
});

it('rejects the unsupported field and nested relation wrapper found in the review', () => {
  for (const entry of [
    add('汤姆.notAWikiField', 'unrendered'),
    add('米雪儿.relations', {
      advantageMaps: [{ id: '经典之家II', description: '', isMinor: true }],
    }),
  ]) {
    expect(() => validate([entry])).toThrow(InvalidGameDataValueError);
  }
});

it('rejects a complete valid character under a new root for both add and set', () => {
  const character = { ...getCanonicalGameData('characters').汤姆, id: '审核探针角色' };
  for (const entry of [add('审核探针角色', character), set('审核探针角色', undefined, character)]) {
    expect(() => validate([entry])).toThrow(
      expect.objectContaining({ detail: { path: '审核探针角色', reason: 'new_character' } })
    );
  }
});

it('rejects a one-way relation that silently overrides an existing mutual relation', () => {
  const canonical = getCanonicalGameData('characters');
  const guard = getCharacterRelation(canonical, '侍卫汤姆');
  expect(guard.counterEachOther.some((item) => item.id === '剑客泰菲')).toBe(true);
  expect(() =>
    validate([
      add('侍卫汤姆.counteredBy', [
        ...guard.counteredBy,
        { id: '剑客泰菲', description: 'example', isMinor: false },
      ]),
    ])
  ).toThrow(
    expect.objectContaining({ detail: expect.objectContaining({ reason: 'relation_conflict' }) })
  );
});

it('allows an atomic relation replacement that explicitly removes the old relation on both sides', () => {
  const canonical = getCanonicalGameData('characters');
  const guard = getCharacterRelation(canonical, '侍卫汤姆');
  const tuffy = getCharacterRelation(canonical, '剑客泰菲');
  expect(() =>
    validate([
      [
        add(
          '侍卫汤姆.counterEachOther',
          guard.counterEachOther.filter((item) => item.id !== '剑客泰菲')
        ),
        add(
          '剑客泰菲.counterEachOther',
          tuffy.counterEachOther.filter((item) => item.id !== '侍卫汤姆')
        ),
        add('侍卫汤姆.counteredBy', [
          ...guard.counteredBy,
          { id: '剑客泰菲', description: 'example', isMinor: false },
        ]),
      ],
    ])
  ).not.toThrow();
});

it('keeps a cross-character relation replacement in one independently approvable row', () => {
  const canonical = getCanonicalGameData('characters');
  const fairy = getExplicitCharacterRelation(canonical, '仙女鼠');
  const toodles = getExplicitCharacterRelation(canonical, '图多盖洛');
  const fairyCounters = [
    ...fairy.counters.filter((item) => item.id !== '图多盖洛'),
    { id: '图多盖洛', description: 'original one-way relation', isMinor: true },
  ];
  const toodlesCounteredBy = [
    ...toodles.counteredBy.filter((item) => item.id !== '仙女鼠'),
    { id: '仙女鼠', description: 'original one-way relation', isMinor: true },
  ];
  // Reconstruct the incident's earlier state explicitly so the regression survives
  // a baseline correction of the real pair from one-way to mutual counters.
  const currentRows: ApprovedCandidateReplayRow[] = [
    {
      rowId: 'historical-one-way-relation',
      entityType: 'characters',
      actions: [
        set('仙女鼠.counterEachOther', undefined, []),
        set(
          '图多盖洛.counterEachOther',
          undefined,
          toodles.counterEachOther.filter((item) => item.id !== '仙女鼠')
        ),
        set('仙女鼠.counters', undefined, fairyCounters),
        set('图多盖洛.counteredBy', undefined, toodlesCounteredBy),
      ],
    },
  ];
  const entries = [
    set(
      '仙女鼠.counters',
      fairyCounters,
      fairyCounters.filter((item) => item.id !== '图多盖洛')
    ),
    set(
      '图多盖洛.counteredBy',
      toodlesCounteredBy,
      toodlesCounteredBy.filter((item) => item.id !== '仙女鼠')
    ),
    set(
      '仙女鼠.counterEachOther',
      [],
      [{ id: '图多盖洛', description: 'mutual replacement', isMinor: true }]
    ),
  ];
  // The addition alone conflicts with the original one-way relation.
  expect(() => validate([entries[2]], currentRows)).toThrow(InvalidGameDataValueError);
  const prepared = preparePublishActionItems([{ entityType: 'characters', entries }]);
  expect(prepared.actions[0]!.rows).toHaveLength(1);
  expect(prepared.actions[0]!.rows[0]!.actions.map((action) => action.path)).toEqual(
    entries.map((entry) => entry.path)
  );
  expect(() => validate(entries, currentRows)).not.toThrow();
  // Approval receives exactly this stored row, with no sibling UUID ordering dependency.
  expect(() => validate([prepared.actions[0]!.rows[0]!.canonicalEntry], currentRows)).not.toThrow();
});

it('rejects opposite map relations and duplicate relations within a collection', () => {
  const map = { id: '经典之家II', description: '', isMinor: false };
  for (const entries of [
    [add('米雪儿.advantageMaps', [map]), add('米雪儿.disadvantageMaps', [map])],
    [add('米雪儿.advantageMaps', [map, map])],
  ])
    expect(() => validate([entries])).toThrow(InvalidGameDataValueError);
});

it('rejects unchanged rows and cancelling edits, even alongside a useful independent row', () => {
  const old = getCanonicalGameData('characters').汤姆!.description;
  const unchanged = set('汤姆.description', old, old);
  for (const entries of [
    [unchanged],
    [[set('汤姆.description', old, 'temporary'), set('汤姆.description', 'temporary', old)]],
    [
      unchanged,
      set('杰瑞.description', getCanonicalGameData('characters').杰瑞!.description, 'edited'),
    ],
  ])
    expect(() => validate(entries)).toThrow(
      expect.objectContaining({ detail: { path: '汤姆.description', reason: 'no_changes' } })
    );
});

it('keeps unchanged array context when a later indexed edit in the same row has a real effect', () => {
  const skills = JSON.parse(JSON.stringify(getCanonicalGameData('characters').汤姆!.skills));
  expect(() =>
    validate([
      [
        set('汤姆.skills', skills, skills),
        set(
          '汤姆.skills.0.skillLevels.0.description',
          skills[0].skillLevels[0].description,
          'edited'
        ),
      ],
    ])
  ).not.toThrow();
});
