import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { areActionsOrderDependent, groupActionEntriesByDependency } from './actionDependencies';

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
    expect(
      areActionsOrderDependent(
        remove('Tom.aliases.0', { name: 'first' }),
        set('Tom.aliases.1.name', 'second', 'updated')
      )
    ).toBe(true);
    expect(
      areActionsOrderDependent(
        set('Tom.aliases.length', 2, 1),
        set('Tom.aliases.0.name', 'first', 'updated')
      )
    ).toBe(true);
    expect(
      areActionsOrderDependent(
        set('Tom.aliases.0', { name: 'first' }, { name: 'updated first' }),
        set('Tom.aliases.1.name', 'second', 'updated')
      )
    ).toBe(true);
    expect(
      areActionsOrderDependent(
        add('Tom.aliases.0', { name: 'inserted' }),
        set('Tom.aliases.1.name', 'second', 'updated')
      )
    ).toBe(true);
  });

  it('should ignore old and new value metadata when classifying a direct index set', () => {
    const neighboringWrite = set('Tom.aliases.1.name', 'second', 'updated');

    expect(
      areActionsOrderDependent(
        set('Tom.aliases.0', { name: 'first' }, { name: 'updated first' }),
        neighboringWrite
      )
    ).toBe(true);
    expect(
      areActionsOrderDependent(
        set('Tom.aliases.0', 'metadata is wrong', 'metadata is also wrong'),
        neighboringWrite
      )
    ).toBe(true);
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
      set('Tom.aliases.1.name', 'second', 'updated second'),
      set('Tom.aliases.1.title', 'old title', 'new title'),
      set('Tom.description', 'old', 'new'),
    ];

    expect(groupActionEntriesByDependency(entries)).toEqual([[0, 1, 2], [3]]);
  });
});
