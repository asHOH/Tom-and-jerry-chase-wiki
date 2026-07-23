import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { areActionsOrderDependent, groupActionEntriesByDependency } from './actionDependencies';
import { applyCheckedActionRow } from './checkedActionReplay';

const set = (path: string, oldValue: unknown, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue,
  newValue,
});

const add = (path: string, newValue: unknown): Action => ({
  op: 'add',
  path,
  oldValue: undefined,
  newValue,
});

const remove = (path: string, oldValue: unknown): Action => ({
  op: 'delete',
  path,
  oldValue,
  newValue: undefined,
});

function expectPairDependency(left: Action, right: Action, expected: boolean): void {
  expect(areActionsOrderDependent(left, right)).toBe(expected);
  expect(areActionsOrderDependent(right, left)).toBe(expected);
}

function replayPair(
  initial: Record<string, unknown>,
  first: Action,
  second: Action
): Record<string, unknown> {
  const target = structuredClone(initial);
  for (const [index, action] of [first, second].entries()) {
    const result = applyCheckedActionRow({
      rowId: `commutativity-${index}`,
      actions: [action],
      targets: [target],
    });
    expect(result).toMatchObject({ success: true });
  }
  return target;
}

describe('areActionsOrderDependent', () => {
  it('should detect repeated and ancestor-descendant writes', () => {
    expect(
      areActionsOrderDependent(
        set('Tom.profile.name', 'Tom', 'Thomas'),
        set('Tom.profile.name', 'Thomas', 'Tommy')
      )
    ).toBe(true);
    expect(
      areActionsOrderDependent(
        set('Tom.profile', {}, { name: 'Tom' }),
        set('Tom.profile.name', 'Tom', 'Thomas')
      )
    ).toBe(true);
  });

  it('should compare path segments rather than string prefixes', () => {
    expect(
      areActionsOrderDependent(
        set('Tom.skill', 'old', 'new'),
        set('Tom.skills.0.name', 'old', 'new')
      )
    ).toBe(false);
  });

  it('should treat writes below a structurally edited array as dependent', () => {
    expectPairDependency(
      remove('Tom.aliases.0', { name: 'first' }),
      set('Tom.aliases.1.name', 'second', 'updated'),
      true
    );
    expectPairDependency(
      set('Tom.aliases.length', 2, 1),
      set('Tom.aliases.0.name', 'first', 'updated'),
      true
    );
    expectPairDependency(
      add('Tom.aliases.0', { name: 'inserted' }),
      set('Tom.aliases.1.name', 'second', 'updated'),
      true
    );
  });

  it('should keep defined direct sets independent from distinct numeric siblings', () => {
    const neighboringWrite = set('Tom.aliases.1.name', 'second', 'updated');

    expectPairDependency(
      set('Tom.aliases.0', { name: 'first' }, { name: 'updated first' }),
      neighboringWrite,
      false
    );
    expectPairDependency(
      set('Tom.aliases.0', 'metadata is wrong', 'metadata is also wrong'),
      neighboringWrite,
      false
    );
    expectPairDependency(
      set('Tom.aliases.2', undefined, { name: 'third' }),
      set('Tom.aliases.3', undefined, { name: 'fourth' }),
      false
    );
  });

  it.each(['foo', '01', '1e2', '4294967295'])(
    'should keep direct sets dependent on non-canonical or property sibling %s',
    (sibling) => {
      expectPairDependency(
        set('Tom.aliases.0', undefined, 'first'),
        set(`Tom.aliases.${sibling}.name`, undefined, 'updated'),
        true
      );
    }
  );

  it('should preserve same-index, parent, and structural-operation dependencies', () => {
    const directSet = set('Tom.aliases.0', undefined, { name: 'first' });

    expectPairDependency(directSet, set('Tom.aliases.0', undefined, 'replacement'), true);
    expectPairDependency(directSet, set('Tom.aliases.0.name', undefined, 'updated'), true);
    expectPairDependency(directSet, set('Tom.aliases', undefined, []), true);
    expectPairDependency(directSet, add('Tom.aliases.1', 'inserted'), true);
    expectPairDependency(directSet, remove('Tom.aliases.1', 'removed'), true);
    expectPairDependency(directSet, set('Tom.aliases.length', 2, 1), true);
  });

  it('should keep legacy direct sets without newValue structural', () => {
    expectPairDependency(
      set('Tom.aliases.0', 'first', undefined),
      set('Tom.aliases.1.name', 'second', 'updated'),
      true
    );
  });

  it('should keep ordinary writes below different array items independent', () => {
    expect(
      areActionsOrderDependent(
        set('Tom.aliases.0.name', 'first', 'updated first'),
        set('Tom.aliases.1.name', 'second', 'updated second')
      )
    ).toBe(false);
  });

  it.each(['Tom..aliases.0', 'Tom.__proto__.aliases', 'Tom.aliases.01'])(
    'should fail closed for invalid path %s',
    (invalidPath) => {
      expect(() =>
        areActionsOrderDependent(
          set(invalidPath, 'old', 'new'),
          set('Jerry.description', 'old', 'new')
        )
      ).not.toThrow();
      expect(
        areActionsOrderDependent(
          set(invalidPath, 'old', 'new'),
          set('Jerry.description', 'old', 'new')
        )
      ).toBe(true);
    }
  );
});

describe('accepted direct array-index assignment pairs', () => {
  it.each([
    {
      name: 'dense arrays',
      initial: { Tom: { aliases: ['zero', 'one'] } },
      left: set('Tom.aliases.0', 'zero', 'updated zero'),
      right: set('Tom.aliases.1', 'one', 'updated one'),
    },
    {
      name: 'assignments extending an array',
      initial: { Tom: { aliases: ['zero'] } },
      left: set('Tom.aliases.2', undefined, 'two'),
      right: set('Tom.aliases.4', undefined, 'four'),
    },
    {
      name: 'nested array paths',
      initial: { Tom: { groups: [{ aliases: [] }] } },
      left: set('Tom.groups.0.aliases.0', undefined, 'zero'),
      right: set('Tom.groups.0.aliases.1', undefined, 'one'),
    },
    {
      name: 'missing intermediate containers',
      initial: {},
      left: set('Tom.aliases.2', undefined, 'two'),
      right: set('Tom.aliases.3', undefined, 'three'),
    },
    {
      name: 'scalar intermediate containers',
      initial: { Tom: { aliases: 'scalar' } },
      left: set('Tom.aliases.2', undefined, 'two'),
      right: set('Tom.aliases.3', undefined, 'three'),
    },
    {
      name: 'container assigned values',
      initial: { Tom: { aliases: [] } },
      left: set('Tom.aliases.0', undefined, { name: 'zero' }),
      right: set('Tom.aliases.1', undefined, ['one']),
    },
  ])('commutes for $name', ({ initial, left, right }) => {
    expectPairDependency(left, right, false);
    expect(replayPair(initial, left, right)).toEqual(replayPair(initial, right, left));
  });

  it.each([
    ['missing', { Tom: {} }],
    ['scalar', { Tom: { aliases: 'scalar' } }],
  ])(
    'rejects numeric/property pairs whose orders diverge against a %s parent',
    (_name, initial) => {
      const numeric = set('Tom.aliases.0', undefined, 'zero');
      const property = set('Tom.aliases.foo', undefined, 'property');

      expectPairDependency(numeric, property, true);

      const numericThenProperty = replayPair(initial, numeric, property);
      const propertyThenNumeric = replayPair(initial, property, numeric);
      const firstAliases = (numericThenProperty.Tom as { aliases: unknown[] }).aliases;
      const secondAliases = (propertyThenNumeric.Tom as { aliases: unknown[] }).aliases;

      expect(Array.isArray(firstAliases)).toBe(true);
      expect(Array.isArray(secondAliases)).toBe(true);
      expect(Object.keys(firstAliases).sort()).toEqual(['0', 'foo']);
      expect(Object.keys(secondAliases)).toEqual(['0']);
      expect((firstAliases as unknown as { foo: unknown }).foo).toBe('property');
      expect((secondAliases as unknown as { foo?: unknown }).foo).toBeUndefined();
    }
  );
});

describe('groupActionEntriesByDependency', () => {
  it('should keep independent entries in separate ordered groups', () => {
    const entries: ActionHistoryEntry[] = [
      set('Tom.profile.name', 'Tom', 'Thomas'),
      set('Tom.description', 'old', 'new'),
    ];

    expect(groupActionEntriesByDependency(entries)).toEqual([[0], [1]]);
  });

  it('should form transitive dependency groups', () => {
    const entries: ActionHistoryEntry[] = [
      set('Tom.profile.name', 'Tom', 'Thomas'),
      set('Tom.profile', {}, { name: 'Thomas', title: 'Cat' }),
      set('Tom.profile.title', 'Cat', 'Mouse catcher'),
      set('Tom.description', 'old', 'new'),
    ];

    expect(groupActionEntriesByDependency(entries)).toEqual([[0, 1, 2], [3]]);
  });

  it('should preserve an existing atomic entry while clustering overlaps', () => {
    const entries: ActionHistoryEntry[] = [
      [set('Tom.profile.name', 'Tom', 'Thomas'), set('Tom.description', 'old', 'new')],
      set('Tom.profile.name', 'Thomas', 'Tommy'),
      set('Jerry.description', 'old', 'new'),
    ];

    expect(groupActionEntriesByDependency(entries)).toEqual([[0, 1], [2]]);
  });

  it('should group a set-delete with writes affected by its array index shift', () => {
    const entries: ActionHistoryEntry[] = [
      set('Tom.aliases.0', { name: 'first' }, undefined),
      set('Tom.aliases.1.name', 'second', 'updated'),
      set('Tom.description', 'old', 'new'),
    ];

    expect(groupActionEntriesByDependency(entries)).toEqual([[0, 1], [2]]);
  });

  it('should form a transitive group through a direct numeric set', () => {
    const entries: ActionHistoryEntry[] = [
      set('Tom.aliases.0', { name: 'first' }, { name: 'updated first' }),
      add('Tom.aliases.1', { name: 'inserted' }),
      set('Tom.aliases.1.title', 'old title', 'new title'),
      set('Tom.description', 'old', 'new'),
    ];

    expect(groupActionEntriesByDependency(entries)).toEqual([[0, 1, 2], [3]]);
  });
});
