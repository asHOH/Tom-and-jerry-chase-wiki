import {
  getActionsStorageKey,
  readActionHistory,
  replaceActionHistory,
  writeActionHistory,
} from './diffUtils';

describe('diffUtils', () => {
  afterEach(() => {
    jest.restoreAllMocks();
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

  it('reports history write and removal failures without changing stored drafts', () => {
    const storageKey = getActionsStorageKey('characters');
    const history = [{ op: 'set' as const, path: 'Tom.name', oldValue: 'old', newValue: 'new' }];
    expect(writeActionHistory(storageKey, history)).toBe(true);

    const originalSetItem = Storage.prototype.setItem;
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string
    ) {
      if (this === window.localStorage) throw new Error('quota');
      return originalSetItem.call(this, key, value);
    });
    expect(writeActionHistory(storageKey, [])).toBe(false);
    expect(readActionHistory(storageKey)).toEqual(history);

    jest.restoreAllMocks();
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(replaceActionHistory(storageKey, [])).toBe(false);
    expect(readActionHistory(storageKey)).toEqual(history);
  });
});
