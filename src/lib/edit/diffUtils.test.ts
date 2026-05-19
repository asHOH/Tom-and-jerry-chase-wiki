import { getActionsStorageKey, readActionHistory } from './diffUtils';

describe('diffUtils', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('should read serialized action history entries with omitted undefined values', () => {
    const storageKey = getActionsStorageKey('characters');
    window.localStorage.setItem(
      storageKey,
      JSON.stringify([
        {
          op: 'set',
          path: 'Tom.description',
          newValue: 'draft description',
        },
        {
          op: 'delete',
          path: 'Tom.aliases.0',
          oldValue: 'old alias',
        },
      ])
    );

    expect(readActionHistory(storageKey)).toEqual([
      expect.objectContaining({
        op: 'set',
        path: 'Tom.description',
        newValue: 'draft description',
      }),
      expect.objectContaining({
        op: 'delete',
        path: 'Tom.aliases.0',
        oldValue: 'old alias',
      }),
    ]);
  });
});
