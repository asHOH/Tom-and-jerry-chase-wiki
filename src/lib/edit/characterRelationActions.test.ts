import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';

import {
  isCharacterRelationAction,
  normalizeCharacterRelationPairHistory,
  parseCharacterRelationActionPath,
  splitCharacterRelationActionHistory,
} from './characterRelationActions';

describe('characterRelationActions', () => {
  it('parses character relation paths with zero-based segment names', () => {
    expect(parseCharacterRelationActionPath('杰瑞.counters.0.description')).toEqual({
      characterId: '杰瑞',
      relationKind: 'counters',
      rest: ['0', 'description'],
    });
  });

  it('rejects non-relation character paths', () => {
    expect(parseCharacterRelationActionPath('杰瑞.description')).toBeNull();
    expect(
      isCharacterRelationAction({
        op: 'set',
        path: '杰瑞.description',
        oldValue: '',
        newValue: 'x',
      })
    ).toBe(false);
  });

  it('classifies shared pair records and their container as relation edits', () => {
    for (const path of ['A.characterRelationOverrides', 'A.characterRelationOverrides.B']) {
      expect(
        isCharacterRelationAction({ op: 'set', path, oldValue: undefined, newValue: null })
      ).toBe(true);
    }
  });

  it('splits map replacements into independent immutable pair actions', () => {
    const first = { kind: 'counters', description: 'first', isMinor: false };
    const second = { kind: 'counteredBy', description: 'second', isMinor: true };
    const ordinary = {
      op: 'set' as const,
      path: 'A.description',
      oldValue: 'old',
      newValue: 'new',
    };
    const normalized = normalizeCharacterRelationPairHistory([
      [
        {
          op: 'set',
          path: 'A.characterRelationOverrides',
          oldValue: { B: first, C: second },
          newValue: { B: first, D: null },
        },
        ordinary,
      ],
    ]);

    expect(normalized).toEqual([
      [
        {
          op: 'delete',
          path: 'A.characterRelationOverrides.C',
          oldValue: second,
          newValue: undefined,
        },
        {
          op: 'set',
          path: 'A.characterRelationOverrides.D',
          oldValue: undefined,
          newValue: null,
        },
        ordinary,
      ],
    ]);
    second.description = 'later mutation';
    expect((normalized[0] as Array<{ oldValue: unknown }>)[0]!.oldValue).toEqual({
      kind: 'counteredBy',
      description: 'second',
      isMinor: true,
    });
  });

  it('drops empty map initialization and preserves malformed drafts for validation', () => {
    expect(
      normalizeCharacterRelationPairHistory([
        { op: 'set', path: 'A.characterRelationOverrides', oldValue: undefined, newValue: {} },
      ])
    ).toEqual([]);
    for (const invalidId of ['B.description', '__proto__', 'constructor']) {
      const malformed = {
        op: 'set' as const,
        path: 'A.characterRelationOverrides',
        oldValue: undefined,
        newValue: Object.fromEntries([[invalidId, null]]),
      };
      expect(normalizeCharacterRelationPairHistory([malformed])).toEqual([malformed]);
    }
  });

  it('splits mixed action history without dropping unrelated drafts', () => {
    const history: ActionHistoryEntry[] = [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      [
        { op: 'set', path: '汤姆.counteredBy', oldValue: [], newValue: [{ id: '杰瑞' }] },
        { op: 'set', path: '汤姆.description', oldValue: 'old', newValue: 'new' },
      ],
    ];

    expect(splitCharacterRelationActionHistory(history)).toEqual({
      matching: [
        { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
        { op: 'set', path: '汤姆.counteredBy', oldValue: [], newValue: [{ id: '杰瑞' }] },
      ],
      remaining: [
        { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
        { op: 'set', path: '汤姆.description', oldValue: 'old', newValue: 'new' },
      ],
    });
  });
});
