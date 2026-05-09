import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { applyPublicActionRows, type PublicActionApplyResult } from './actionReplay';
import type { PublicActionRow } from './publicActionsTypes';

const row = (id: string, entry: unknown, entityType = 'characters'): PublicActionRow => ({
  id,
  entity_type: entityType,
  entry,
  created_at: '2026-05-09T00:00:00.000Z',
  status: 'approved',
  message: null,
  reviewed_at: null,
  created_by: null,
});

describe('applyPublicActionRows', () => {
  it('should skip already handled rows', () => {
    const target: Record<string, unknown> = {};
    const handledIds = new Set(['already-applied']);

    const result = applyPublicActionRows({
      rows: [
        row('already-applied', {
          op: 'set',
          path: 'Tom.description',
          oldValue: undefined,
          newValue: 'new',
        }),
      ],
      handledIds,
      resolveTargets: () => [target],
    });

    expect(target).toEqual({});
    expect(result).toEqual({ handledCount: 0, mutatedCount: 0, handledIds: [] });
  });

  it('should skip invalid entries without marking them handled', () => {
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [row('invalid-entry', { op: 'replace', path: 'Tom.description' })],
      handledIds,
      resolveTargets: () => [{ Tom: {} }],
    });

    expect(handledIds.has('invalid-entry')).toBe(false);
    expect(result).toEqual({ handledCount: 0, mutatedCount: 0, handledIds: [] });
  });

  it('should apply one row to multiple targets', () => {
    const staticTarget: Record<string, unknown> = { Tom: { description: 'old' } };
    const editTarget: Record<string, unknown> = { Tom: { description: 'old' } };
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [
        row('multi-target', {
          op: 'set',
          path: 'Tom.description',
          oldValue: 'old',
          newValue: 'new',
        }),
      ],
      handledIds,
      resolveTargets: () => [staticTarget, editTarget],
    });

    expect(staticTarget).toEqual({ Tom: { description: 'new' } });
    expect(editTarget).toEqual({ Tom: { description: 'new' } });
    expect(result).toEqual({ handledCount: 1, mutatedCount: 1, handledIds: ['multi-target'] });
  });

  it('should allow custom applyEntry behavior', () => {
    const applied: Array<{ rowId: string; entry: ActionHistoryEntry }> = [];
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [
        row('custom-apply', [
          {
            op: 'set',
            path: 'Tom.description',
            oldValue: 'old',
            newValue: 'new',
          },
        ]),
      ],
      handledIds,
      resolveTargets: () => null,
      applyEntry: (actionRow, entry): PublicActionApplyResult => {
        applied.push({ rowId: actionRow.id, entry });
        return 'mutated';
      },
    });

    expect(applied).toHaveLength(1);
    expect(applied[0]?.rowId).toBe('custom-apply');
    expect(result).toEqual({ handledCount: 1, mutatedCount: 1, handledIds: ['custom-apply'] });
  });

  it('should preserve known no-op rows as handled without counting mutations', () => {
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [
        row(
          'known-no-op',
          {
            op: 'set',
            path: 'cat.description',
            oldValue: 'old',
            newValue: 'new',
          },
          'factions'
        ),
      ],
      handledIds,
      resolveTargets: () => [],
    });

    expect(handledIds.has('known-no-op')).toBe(true);
    expect(result).toEqual({ handledCount: 1, mutatedCount: 0, handledIds: ['known-no-op'] });
  });

  it('should leave unknown target rows unhandled', () => {
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [
        row(
          'unknown-target',
          {
            op: 'set',
            path: 'Tom.description',
            oldValue: 'old',
            newValue: 'new',
          },
          'unknown'
        ),
      ],
      handledIds,
      resolveTargets: () => null,
    });

    expect(handledIds.has('unknown-target')).toBe(false);
    expect(result).toEqual({ handledCount: 0, mutatedCount: 0, handledIds: [] });
  });

  it('should run default application inside applyWithin when provided', () => {
    const target: Record<string, unknown> = { Tom: { description: 'old' } };
    const calls: string[] = [];

    applyPublicActionRows({
      rows: [
        row('within', {
          op: 'set',
          path: 'Tom.description',
          oldValue: 'old',
          newValue: 'new',
        }),
      ],
      handledIds: new Set<string>(),
      resolveTargets: () => [target],
      applyWithin: (actionRow, fn) => {
        calls.push(`before:${actionRow.id}`);
        fn();
        calls.push(`after:${actionRow.id}`);
      },
    });

    expect(calls).toEqual(['before:within', 'after:within']);
    expect(target).toEqual({ Tom: { description: 'new' } });
  });
});
