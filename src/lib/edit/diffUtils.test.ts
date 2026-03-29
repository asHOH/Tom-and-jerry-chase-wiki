import type { INTERNAL_Op } from 'valtio';

import { actionHistorySchema } from '@/lib/validation/schemas';

import { actionsFromValtioOps, withActionContext } from './diffUtils';

const makeSetOp = (path: string[], nextValue: unknown, oldValue: unknown): INTERNAL_Op =>
  ['set', path, nextValue, oldValue] as unknown as INTERNAL_Op;

describe('diffUtils action attribution', () => {
  it('should preserve sourceEntityId in persisted action history schema', () => {
    const parsed = actionHistorySchema.safeParse([
      {
        op: 'set',
        path: 'tom.counters',
        oldValue: [],
        newValue: ['jerry'],
        sourceEntityId: 'jerry',
      },
    ]);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const entry = parsed.data[0] as
      | { sourceEntityId?: string }
      | Array<{ sourceEntityId?: string }>;
    expect(Array.isArray(entry)).toBe(false);
    if (Array.isArray(entry)) return;

    expect(entry.sourceEntityId).toBe('jerry');
  });

  it('should attach sourceEntityId inside a scoped action context', () => {
    const [action] = withActionContext({ sourceEntityId: 'jerry' }, () =>
      actionsFromValtioOps([makeSetOp(['tom', 'counters'], ['jerry'], [])])
    );

    expect(action).toMatchObject({
      op: 'set',
      path: 'tom.counters',
      sourceEntityId: 'jerry',
    });
  });

  it('should restore the previous action context after nested scopes', () => {
    const result = withActionContext({ sourceEntityId: 'outer' }, () => ({
      outerBefore: actionsFromValtioOps([makeSetOp(['a'], 1, 0)])[0],
      inner: withActionContext(
        { sourceEntityId: 'inner' },
        () => actionsFromValtioOps([makeSetOp(['b'], 2, 1)])[0]
      ),
      outerAfter: actionsFromValtioOps([makeSetOp(['c'], 3, 2)])[0],
    }));

    expect(result.outerBefore?.sourceEntityId).toBe('outer');
    expect(result.inner?.sourceEntityId).toBe('inner');
    expect(result.outerAfter?.sourceEntityId).toBe('outer');
  });

  it('should not leak attribution outside the scoped context', () => {
    withActionContext({ sourceEntityId: 'scoped' }, () => {
      actionsFromValtioOps([makeSetOp(['scoped'], true, false)]);
    });

    const [action] = actionsFromValtioOps([makeSetOp(['plain'], true, false)]);
    expect(action?.sourceEntityId).toBeUndefined();
  });
});
