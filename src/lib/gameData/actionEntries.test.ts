import type { Action } from '@/lib/edit/diffUtils';

import { flattenActionEntries, normalizePublicActionEntries } from './actionEntries';

describe('normalizePublicActionEntries', () => {
  it('should wrap a single action entry in an array', () => {
    const action = {
      op: 'set',
      path: 'Tom.description',
      oldValue: 'old',
      newValue: 'new',
    };

    expect(normalizePublicActionEntries(action)).toEqual([action]);
  });

  it('should treat a plain action array as multiple entries', () => {
    const actions = [
      {
        op: 'set',
        path: 'Tom.description',
        oldValue: 'old',
        newValue: 'new',
      },
      {
        op: 'delete',
        path: 'Tom.aliases.0',
        oldValue: 'old alias',
        newValue: undefined,
      },
    ];

    expect(normalizePublicActionEntries(actions)).toEqual(actions);
  });

  it('should keep an array of entries as multiple normalized entries', () => {
    const entries = [
      {
        op: 'set',
        path: 'Tom.description',
        oldValue: 'old',
        newValue: 'new',
      },
      [
        {
          op: 'add',
          path: 'Tom.aliases.0',
          oldValue: undefined,
          newValue: 'alias',
        },
      ],
    ];

    expect(normalizePublicActionEntries(entries)).toEqual(entries);
  });

  it('should return an empty array for invalid entries', () => {
    expect(normalizePublicActionEntries([{ op: 'replace', path: 'Tom.description' }])).toEqual([]);
  });
});

describe('flattenActionEntries', () => {
  it('should flatten mixed action history entries into actions', () => {
    const action: Action = {
      op: 'set',
      path: 'Tom.description',
      oldValue: 'old',
      newValue: 'new',
    };
    const batch: Action[] = [
      {
        op: 'delete',
        path: 'Tom.aliases.0',
        oldValue: 'alias',
        newValue: undefined,
      },
    ];

    expect(flattenActionEntries([action, batch])).toEqual([action, ...batch]);
  });
});
