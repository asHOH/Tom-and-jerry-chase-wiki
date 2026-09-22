import { squashActions } from '@/lib/edit/actionSquash';
import type { Action } from '@/lib/edit/diffUtils';

import { StaleGameDataEditError, validateActionFreshness } from './actionFreshness';
import type { ApprovedCandidateReplayRow } from './approvedCandidateReplay';
import { getCanonicalGameData } from './published/canonicalSources';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('./published/canonicalSources', () => ({ getCanonicalGameData: jest.fn() }));

const set = (path: string, oldValue: unknown, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue,
  newValue,
});
const row = (rowId: string, ...actions: Action[]): ApprovedCandidateReplayRow => ({
  rowId,
  entityType: 'characters',
  actions,
});

describe('new action freshness', () => {
  let baseline: Record<string, unknown>;
  beforeEach(() => {
    baseline = {
      Tom: {
        description: 'original',
        other: 'unchanged',
        nullable: null,
        counters: [
          { id: 'Michelle', description: '' },
          { id: 'Musician', description: '' },
        ],
        optional: undefined,
      },
    };
    jest.mocked(getCanonicalGameData).mockReturnValue(baseline as never);
  });

  it('rejects a second editor overwriting a newer value', () => {
    expect(() =>
      validateActionFreshness(
        [row('published', set('Tom.description', 'original', 'newer'))],
        [row('stale', set('Tom.description', 'original', 'my edit'))]
      )
    ).toThrow(StaleGameDataEditError);
  });

  it('rejects stale whole-list addition that would erase newer descriptions (Wind Tom)', () => {
    const old = [
      { id: 'Michelle', description: '' },
      { id: 'Musician', description: '' },
    ];
    const current = old.map((item) => ({ ...item, description: 'new description' }));
    expect(() =>
      validateActionFreshness(
        [row('descriptions', set('Tom.counters', old, current))],
        [
          row(
            'stale-addition',
            set('Tom.counters', old, [...old, { id: 'Baum', description: 'added' }])
          ),
        ]
      )
    ).toThrow(StaleGameDataEditError);
  });

  it('accepts independent edits despite other published changes and leaves inputs untouched', () => {
    const previous = structuredClone(baseline);
    const published = [row('published', set('Tom.description', 'original', 'newer'))];
    const proposed = [row('independent', set('Tom.other', 'unchanged', 'my edit'))];
    const actionsBefore = structuredClone([published, proposed]);
    expect(() => validateActionFreshness(published, proposed)).not.toThrow();
    expect(baseline).toEqual(previous);
    expect([published, proposed]).toEqual(actionsBefore);
  });

  it('checks each action against preceding edits in the same request', () => {
    expect(() =>
      validateActionFreshness(
        [],
        [
          row(
            'sequence',
            set('Tom.description', 'original', 'first'),
            set('Tom.description', 'first', 'second')
          ),
        ]
      )
    ).not.toThrow();
    expect(() =>
      validateActionFreshness(
        [],
        [
          row(
            'broken-sequence',
            set('Tom.description', 'original', 'first'),
            set('Tom.description', 'original', 'second')
          ),
        ]
      )
    ).toThrow(StaleGameDataEditError);
  });

  it('allows unchanged values and real additions, but not omitted old values over existing data', () => {
    expect(() =>
      validateActionFreshness(
        [],
        [
          row(
            'new',
            set('Tom.description', 'original', 'original'),
            set('Tom.newField', undefined, 'added'),
            { op: 'add', path: 'Tom.newObject', oldValue: undefined, newValue: { name: 'new' } },
            set('Tom.newObject.name', 'new', 'updated')
          ),
        ]
      )
    ).not.toThrow();
    expect(() =>
      validateActionFreshness(
        [],
        [row('missing-old', set('Tom.description', undefined, 'replacement'))]
      )
    ).toThrow(StaleGameDataEditError);
  });

  it('distinguishes absent fields from null and prevents replacing scalar ancestors', () => {
    expect(() =>
      validateActionFreshness([], [row('null', set('Tom.nullable', undefined, 'replacement'))])
    ).toThrow(StaleGameDataEditError);
    expect(() =>
      validateActionFreshness(
        [],
        [row('ancestor', set('Tom.description.field', undefined, 'replacement'))]
      )
    ).toThrow(StaleGameDataEditError);
    expect(() =>
      validateActionFreshness([], [row('known-null', set('Tom.nullable', null, 'replacement'))])
    ).not.toThrow();
  });

  it('compares whole objects in the same JSON representation the editor receives', () => {
    const old = JSON.parse(JSON.stringify(baseline.Tom));
    expect(() =>
      validateActionFreshness(
        [],
        [row('object', set('Tom', old, { ...old, description: 'edited' }))]
      )
    ).not.toThrow();
  });

  it('rejects property adds that replace existing data and stale deletes', () => {
    expect(() =>
      validateActionFreshness(
        [],
        [
          row('add', {
            op: 'add',
            path: 'Tom.description',
            oldValue: undefined,
            newValue: 'overwritten',
          }),
        ]
      )
    ).toThrow(StaleGameDataEditError);
    expect(() =>
      validateActionFreshness(
        [],
        [
          row('delete', {
            op: 'delete',
            path: 'Tom.description',
            oldValue: 'outdated',
            newValue: undefined,
          }),
        ]
      )
    ).toThrow(StaleGameDataEditError);
    expect(() =>
      validateActionFreshness(
        [],
        [
          row('delete', {
            op: 'delete',
            path: 'Tom.description',
            oldValue: 'original',
            newValue: undefined,
          }),
        ]
      )
    ).not.toThrow();
  });

  it.each([
    { op: 'add', path: 'Tom.counters.2', oldValue: undefined, newValue: { id: 'Baum' } },
    {
      op: 'delete',
      path: 'Tom.counters.0',
      oldValue: { id: 'Michelle', description: '' },
      newValue: undefined,
    },
    set('Tom.counters.length', 2, 1),
    set('Tom.counters.2', undefined, { id: 'Baum' }),
  ] as Action[])('requires array context for structural operation $op $path', (action) => {
    try {
      validateActionFreshness([], [row('structure', action)]);
      throw new Error('Expected a conflict');
    } catch (error) {
      expect(error).toBeInstanceOf(StaleGameDataEditError);
      expect(error).toMatchObject({ detail: { reason: 'array_context_required' } });
    }
  });

  it('accepts complete fresh array replacements and checked indexed fields', () => {
    const old = (baseline.Tom as { counters: unknown[] }).counters;
    expect(() =>
      validateActionFreshness(
        [],
        [
          row(
            'array',
            set('Tom.counters', old, [...old, { id: 'Baum', description: '' }]),
            set('Tom.counters.2.description', '', 'added description')
          ),
        ]
      )
    ).not.toThrow();
  });

  it('accepts structural additions normalized by the existing editor', () => {
    const old = (baseline.Tom as { counters: unknown[] }).counters;
    const added = { id: 'Baum', description: 'new' };
    const entries = squashActions([set('Tom.counters.2', undefined, added)], {
      currentRoot: { Tom: { ...(baseline.Tom as object), counters: [...old, added] } },
    });
    const actions = entries.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
    expect(actions).toEqual([set('Tom.counters', old, [...old, added])]);
    expect(() => validateActionFreshness([], [row('editor', ...actions)])).not.toThrow();
  });

  it('requires list identity context even when a shifted indexed field has the same old value', () => {
    const old = (baseline.Tom as { counters: Array<{ id: string; description: string }> }).counters;
    const edit = set('Tom.counters.0.description', '', 'Michelle edit');
    const entries = squashActions([edit], {
      currentRoot: {
        Tom: {
          ...(baseline.Tom as object),
          counters: [{ ...old[0], description: 'Michelle edit' }, old[1]],
        },
      },
    });
    const normalized = entries.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
    expect(normalized[0]?.path).toBe('Tom.counters');
    expect(() => validateActionFreshness([], [row('fresh', ...normalized)])).not.toThrow();
    const reordered = [row('reorder', set('Tom.counters', old, [old[1], old[0]]))];
    expect(() => validateActionFreshness(reordered, [row('stale', ...normalized)])).toThrow(
      StaleGameDataEditError
    );
    expect(() => validateActionFreshness(reordered, [row('missing-context', edit)])).toThrow(
      StaleGameDataEditError
    );
  });

  it('does not revalidate oldValue in historical rows, including compacted effects', () => {
    expect(() =>
      validateActionFreshness(
        [row('legacy', set('Tom.description', 'older than baseline', 'newer'))],
        [row('fresh', set('Tom.description', 'newer', 'latest'))]
      )
    ).not.toThrow();
  });

  it('continues rejecting unsafe action paths', () => {
    expect(() =>
      validateActionFreshness([], [row('invalid', set('Tom.__proto__.value', undefined, 'bad'))])
    ).toThrow();
    expect(({} as Record<string, unknown>).value).toBeUndefined();
  });
});
