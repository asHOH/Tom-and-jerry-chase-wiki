import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { areActionsOrderDependent, groupActionEntriesByDependency } from './actionDependencies';

const set = (path: string, oldValue: unknown, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue,
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
        set('Tom.aliases.0', { name: 'first' }, undefined),
        set('Tom.aliases.1.name', 'second', 'updated')
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
});
