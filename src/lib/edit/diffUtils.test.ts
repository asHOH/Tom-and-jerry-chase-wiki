import { proxy, subscribe, unstable_enableOp, type INTERNAL_Op } from 'valtio';

import { actionHistorySchema } from '@/lib/validation/schemas';

import { actionsFromValtioOps, splitActionHistoryByEntity, withActionContext } from './diffUtils';

const makeSetOp = (path: string[], nextValue: unknown, oldValue: unknown): INTERNAL_Op =>
  ['set', path, nextValue, oldValue] as unknown as INTERNAL_Op;

describe('diffUtils action attribution', () => {
  beforeAll(() => {
    unstable_enableOp(true);
  });

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

  it('should split mixed history entries by sourceEntityId before path fallback', () => {
    const canonicalizedAction = {
      op: 'set' as const,
      path: 'tom.counters',
      oldValue: [],
      newValue: ['jerry'],
      sourceEntityId: 'jerry',
    };
    const mixedBatch = [
      {
        op: 'set' as const,
        path: 'jerry.description',
        oldValue: 'old',
        newValue: 'new',
      },
      {
        op: 'set' as const,
        path: 'jerry.counteredBy',
        oldValue: [],
        newValue: ['tom'],
        sourceEntityId: 'tom',
      },
    ];
    const history = [canonicalizedAction, mixedBatch];

    const { matching, remaining } = splitActionHistoryByEntity(history, 'jerry');

    expect(matching).toEqual([canonicalizedAction, mixedBatch[0]]);
    expect(remaining).toEqual([mixedBatch[1]]);
  });

  it('should keep legacy path matching for actions without sourceEntityId', () => {
    const history = [
      {
        op: 'set' as const,
        path: 'jerry.description',
        oldValue: 'old',
        newValue: 'new',
      },
    ];

    const { matching, remaining } = splitActionHistoryByEntity(history, 'jerry');

    expect(matching).toEqual(history);
    expect(remaining).toEqual([]);
  });

  it('should preserve attribution through a synchronous valtio subscription', () => {
    const state = proxy({
      tom: {
        counters: [] as string[],
      },
    });
    const recorded: ReturnType<typeof actionsFromValtioOps>[] = [];
    const unsubscribe = subscribe(
      state,
      (ops) => {
        recorded.push(actionsFromValtioOps(ops));
      },
      true
    );

    withActionContext({ sourceEntityId: 'jerry' }, () => {
      state.tom.counters = ['jerry'];
    });

    unsubscribe();

    expect(recorded).toEqual([
      [
        {
          op: 'set',
          path: 'tom.counters',
          oldValue: [],
          newValue: ['jerry'],
          sourceEntityId: 'jerry',
        },
      ],
    ]);
  });
});
