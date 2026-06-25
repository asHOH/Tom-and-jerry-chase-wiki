import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';

import {
  isCharacterRelationAction,
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
