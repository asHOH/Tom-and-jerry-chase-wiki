import type { Action } from '@/lib/edit/diffUtils';

import {
  decodeStoredActionRow,
  flattenActionEntries,
  normalizePublicActionEntries,
} from './actionEntries';

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

describe('decodeStoredActionRow', () => {
  it('should retain the exact raw entry and flatten a valid legacy mixed row in order', () => {
    const rawEntry = [
      {
        op: 'set',
        path: 'Tom.description',
        oldValue: 'old',
        newValue: 'new',
        legacyMetadata: 'retained only in rawEntry',
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

    const result = decodeStoredActionRow({ id: 'row-1', entry: rawEntry });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value.rawEntry).toEqual(rawEntry);
    expect(result.value.actions).toEqual([
      {
        op: 'set',
        path: 'Tom.description',
        oldValue: 'old',
        newValue: 'new',
      },
      {
        op: 'add',
        path: 'Tom.aliases.0',
        oldValue: undefined,
        newValue: 'alias',
      },
    ]);
  });

  it('should reject a complete row when one child is malformed', () => {
    const result = decodeStoredActionRow({
      id: 'row-invalid',
      entry: [
        { op: 'set', path: 'Tom.description', newValue: 'valid' },
        { op: 'replace', path: 'Tom.description', newValue: 'invalid' },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: 'invalid_entry',
        rowId: 'row-invalid',
        message: 'Stored action row entry is empty or malformed',
      },
    });
  });

  it('should isolate and freeze decoded values from later caller mutation', () => {
    const rawEntry = {
      op: 'set',
      path: 'Tom.description',
      oldValue: { text: 'old' },
      newValue: { text: 'new' },
    };
    const result = decodeStoredActionRow({ id: 'row-2', entry: rawEntry });

    expect(result.success).toBe(true);
    if (!result.success) return;

    rawEntry.path = 'Jerry.description';
    rawEntry.newValue.text = 'changed';

    expect(result.value.rawEntry).toEqual({
      op: 'set',
      path: 'Tom.description',
      oldValue: { text: 'old' },
      newValue: { text: 'new' },
    });
    expect(result.value.actions[0]).toEqual({
      op: 'set',
      path: 'Tom.description',
      oldValue: { text: 'old' },
      newValue: { text: 'new' },
    });
    expect(Object.isFrozen(result.value.rawEntry)).toBe(true);
    expect(Object.isFrozen(result.value.actions)).toBe(true);
    expect(Object.isFrozen(result.value.actions[0]?.newValue)).toBe(true);
  });
});
