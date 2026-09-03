import type { Action, ActionHistoryEntry } from './diffUtils';
import { reconcilePublishHistory } from './publishHistory';

const entry = (path: string, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue: null,
  newValue,
});

describe('reconcilePublishHistory', () => {
  const preservationCases: Array<{
    name: string;
    source: ActionHistoryEntry[];
    remaining: ActionHistoryEntry[];
    latest: ActionHistoryEntry[];
    expected: ActionHistoryEntry[];
  }> = [
    {
      name: 'unchanged history',
      source: [entry('Tom.name', '汤姆'), entry('Jerry.name', '杰瑞')],
      remaining: [entry('Jerry.name', '杰瑞')],
      latest: [entry('Tom.name', '汤姆'), entry('Jerry.name', '杰瑞')],
      expected: [entry('Jerry.name', '杰瑞')],
    },
    {
      name: 'same-scope and unrelated appended entries',
      source: [entry('Tom.name', '汤姆'), entry('Jerry.name', '杰瑞')],
      remaining: [entry('Jerry.name', '杰瑞')],
      latest: [
        entry('Tom.name', '汤姆'),
        entry('Jerry.name', '杰瑞'),
        entry('Tom.description', 'new draft'),
        [entry('Jerry.description', 'new unrelated draft'), entry('Tom.alias', '猫')],
      ],
      expected: [
        entry('Jerry.name', '杰瑞'),
        entry('Tom.description', 'new draft'),
        [entry('Jerry.description', 'new unrelated draft'), entry('Tom.alias', '猫')],
      ],
    },
  ];

  it.each(preservationCases)('preserves $name', ({ source, remaining, latest, expected }) => {
    expect(reconcilePublishHistory(source, remaining, latest)).toEqual(expected);
  });

  const divergentCases: Array<
    [string, ActionHistoryEntry[], ActionHistoryEntry[], ActionHistoryEntry[]]
  > = [
    ['divergent', [entry('Tom.name', '汤姆')], [], [entry('Tom.name', '汤姆（改）')]],
    [
      'reordered',
      [entry('Tom.name', '汤姆'), entry('Tom.alias', '猫')],
      [],
      [entry('Tom.alias', '猫'), entry('Tom.name', '汤姆')],
    ],
    ['shorter', [entry('Tom.name', '汤姆')], [], []],
  ];

  it.each(divergentCases)(
    'returns a conflict for %s history',
    (_name, source, remaining, latest) => {
      expect(reconcilePublishHistory(source, remaining, latest)).toBeNull();
    }
  );
});
