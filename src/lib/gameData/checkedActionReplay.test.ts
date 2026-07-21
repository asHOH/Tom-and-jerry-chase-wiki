import type { Action } from '@/lib/edit/diffUtils';

import {
  applyCheckedAction,
  applyCheckedActionRow,
  CheckedActionReplayInvariantError,
  collectTouchedRootKeys,
} from './checkedActionReplay';

const action = (
  op: Action['op'],
  path: string,
  newValue: unknown,
  oldValue: unknown = undefined
): Action => ({ op, path, oldValue, newValue });

describe('applyCheckedAction', () => {
  it('creates and replaces containers while preserving sparse set behavior', () => {
    const target: Record<string, unknown> = { Tom: { aliases: 'not-an-array' } };

    const result = applyCheckedAction(target, action('set', 'Tom.aliases.2.name', '侦探汤姆'));

    expect(result).toEqual({ success: true });
    expect(target).toEqual({
      Tom: { aliases: [undefined, undefined, { name: '侦探汤姆' }] },
    });
  });

  it('supports equal-value set and valid array length assignment', () => {
    const target = { Tom: { aliases: ['a', 'b', 'c'], name: '汤姆' } };

    expect(applyCheckedAction(target, action('set', 'Tom.name', '汤姆', '汤姆'))).toEqual({
      success: true,
    });
    expect(applyCheckedAction(target, action('set', 'Tom.aliases.length', 1, 3))).toEqual({
      success: true,
    });
    expect(target.Tom.aliases).toEqual(['a']);
  });

  it('preserves sparse direct array set behavior', () => {
    const target = { Tom: { aliases: ['a'] as Array<string | undefined> } };

    expect(applyCheckedAction(target, action('set', 'Tom.aliases.3', 'd'))).toEqual({
      success: true,
    });
    expect(target.Tom.aliases).toEqual(['a', undefined, undefined, 'd']);
  });

  it('reports invalid array length without mutation', () => {
    const target = { Tom: { aliases: ['a'] } };

    const result = applyCheckedAction(target, action('set', 'Tom.aliases.length', -1, 1));

    expect(result).toMatchObject({
      success: false,
      error: { code: 'invalid_array_length', operation: 'set', path: 'Tom.aliases.length' },
    });
    expect(target.Tom.aliases).toEqual(['a']);
  });

  it('treats stored set without newValue as checked delete', () => {
    const target = { Tom: { aliases: ['a', 'b'] } };

    expect(applyCheckedAction(target, action('set', 'Tom.aliases.0', undefined, 'a'))).toEqual({
      success: true,
    });
    expect(target.Tom.aliases).toEqual(['b']);

    expect(
      applyCheckedAction(target, action('set', 'Tom.aliases.5', undefined, 'missing'))
    ).toMatchObject({ success: false, error: { code: 'missing_path' } });
  });

  it('inserts numeric adds with append clamping and overwrites object properties', () => {
    const target = { Tom: { aliases: ['a'], title: 'old' } };

    expect(applyCheckedAction(target, action('add', 'Tom.aliases.99', 'b'))).toEqual({
      success: true,
    });
    expect(applyCheckedAction(target, action('add', 'Tom.title', 'new'))).toEqual({
      success: true,
    });
    expect(target).toEqual({ Tom: { aliases: ['a', 'b'], title: 'new' } });
  });

  it('clones frozen container values for assignment and array insertion', () => {
    const assignedValue = Object.freeze({ description: 'assigned' });
    const insertedValue = Object.freeze({ description: 'inserted' });
    const target: Record<string, unknown> = { Tom: { groups: [] } };

    expect(applyCheckedAction(target, action('set', 'Tom.profile', assignedValue))).toEqual({
      success: true,
    });
    expect(applyCheckedAction(target, action('add', 'Tom.groups.0', insertedValue))).toEqual({
      success: true,
    });

    const tom = target.Tom as { profile: unknown; groups: unknown[] };
    expect(tom.profile).toEqual(assignedValue);
    expect(tom.profile).not.toBe(assignedValue);
    expect(tom.groups[0]).toEqual(insertedValue);
    expect(tom.groups[0]).not.toBe(insertedValue);
    expect(Object.isFrozen(tom.profile)).toBe(false);
    expect(Object.isFrozen(tom.groups[0])).toBe(false);
  });

  it('reports an uncloneable action value before mutating the target', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const target: Record<string, unknown> = {};

    expect(applyCheckedAction(target, action('set', 'Tom.profile', circular))).toMatchObject({
      success: false,
      error: { code: 'clone_failed', path: 'Tom.profile' },
    });
    expect(target).toEqual({});
  });

  it('rejects add without newValue and missing delete paths', () => {
    const target = { Tom: { aliases: [] } };

    expect(applyCheckedAction(target, action('add', 'Tom.aliases.0', undefined))).toMatchObject({
      success: false,
      error: { code: 'missing_new_value' },
    });
    expect(applyCheckedAction(target, action('delete', 'Tom.missing', undefined))).toMatchObject({
      success: false,
      error: { code: 'missing_path' },
    });
  });

  it('splices checked array deletes and rejects non-canonical array indexes', () => {
    const target = { Tom: { aliases: ['a', 'b'] } };

    expect(applyCheckedAction(target, action('delete', 'Tom.aliases.0', undefined))).toEqual({
      success: true,
    });
    expect(target.Tom.aliases).toEqual(['b']);
    expect(applyCheckedAction(target, action('set', 'Tom.aliases.01', 'bad'))).toMatchObject({
      success: false,
      error: { code: 'invalid_array_index', segment: '01' },
    });
  });
});

describe('applyCheckedActionRow', () => {
  it('collects unique touched roots in action order', () => {
    expect(
      collectTouchedRootKeys([
        action('set', 'Tom.description', 'new'),
        action('set', 'Jerry.description', 'new'),
        action('set', 'Tom.name', 'new'),
      ])
    ).toEqual({ success: true, value: ['Tom', 'Jerry'] });
  });

  it('applies a complete row to every target and reports touched roots', () => {
    const first = { Tom: { description: 'old' }, Jerry: { description: 'old' } };
    const second = structuredClone(first);

    const result = applyCheckedActionRow({
      rowId: 'row-success',
      actions: [
        action('set', 'Tom.description', 'new', 'old'),
        action('set', 'Jerry.description', 'new', 'old'),
      ],
      targets: [first, second],
    });

    expect(result).toEqual({
      success: true,
      value: { touchedRootKeys: ['Tom', 'Jerry'], targetCount: 2 },
    });
    expect(first).toEqual({ Tom: { description: 'new' }, Jerry: { description: 'new' } });
    expect(second).toEqual(first);
  });

  it('clones container action values independently for every target', () => {
    const payload = Object.freeze({ nested: Object.freeze({ description: 'initial' }) });
    const first: Record<string, unknown> = {};
    const second: Record<string, unknown> = {};

    const result = applyCheckedActionRow({
      rowId: 'row-container-isolation',
      actions: [action('set', 'Tom.profile', payload)],
      targets: [first, second],
    });

    expect(result.success).toBe(true);
    const firstProfile = (first.Tom as { profile: { nested: { description: string } } }).profile;
    const secondProfile = (second.Tom as { profile: { nested: { description: string } } }).profile;
    expect(firstProfile).toEqual(payload);
    expect(firstProfile).not.toBe(payload);
    expect(firstProfile).not.toBe(secondProfile);
    expect(firstProfile.nested).not.toBe(secondProfile.nested);

    firstProfile.nested.description = 'changed';
    expect(secondProfile.nested.description).toBe('initial');
  });

  it('rolls every target back when a middle action fails', () => {
    const first = { Tom: { description: 'old', aliases: ['a'] } };
    const second = { Tom: { description: 'old' } };
    const firstBefore = structuredClone(first);
    const secondBefore = structuredClone(second);

    const result = applyCheckedActionRow({
      rowId: 'row-failure',
      actions: [
        action('set', 'Tom.description', 'new', 'old'),
        action('delete', 'Tom.aliases.0', undefined, 'a'),
      ],
      targets: [first, second],
    });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'missing_path',
        rowId: 'row-failure',
        stage: 'apply',
        actionIndex: 1,
        targetIndex: 1,
      },
    });
    expect(first).toEqual(firstBefore);
    expect(second).toEqual(secondBefore);
  });

  it('removes intermediate containers created before a checked failure', () => {
    const target: Record<string, unknown> = {};

    const result = applyCheckedActionRow({
      rowId: 'row-partial-container',
      actions: [action('set', 'Tom.aliases.01', 'invalid')],
      targets: [target],
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: 'invalid_array_index', rowId: 'row-partial-container', stage: 'apply' },
    });
    expect(target).toEqual({});
  });

  it('returns a structured backup failure before mutation', () => {
    const target = { Tom: { uncloneable: () => undefined } };

    const result = applyCheckedActionRow({
      rowId: 'row-backup-failure',
      actions: [action('set', 'Tom.description', 'new')],
      targets: [target],
    });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'clone_failed',
        rowId: 'row-backup-failure',
        stage: 'backup',
        targetIndex: 0,
        rootKey: 'Tom',
      },
    });
    expect(target).toEqual({ Tom: { uncloneable: expect.any(Function) } });
  });

  it('throws a fatal invariant error when rollback cannot restore a root', () => {
    const rawTarget = { Tom: { description: 'old' } };
    const target = new Proxy(rawTarget, {
      set(current, property, value) {
        if (property === 'Tom') return false;
        return Reflect.set(current, property, value);
      },
    });

    let thrown: unknown;
    try {
      applyCheckedActionRow({
        rowId: 'row-rollback-failure',
        actions: [
          action('set', 'Tom.description', 'new', 'old'),
          action('delete', 'Tom.missing', undefined),
        ],
        targets: [target],
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CheckedActionReplayInvariantError);
    expect((thrown as CheckedActionReplayInvariantError).detail).toEqual({
      code: 'invariant_failed',
      rowId: 'row-rollback-failure',
      stage: 'rollback',
    });
  });
});
