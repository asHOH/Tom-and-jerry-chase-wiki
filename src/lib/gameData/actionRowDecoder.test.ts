import { ACTION_PROCESSING_ERROR_CODES } from './actionErrors';
import { decodeActionRowEntry, decodeStoredActionRow } from './actionRowDecoder';

describe('action processing error codes', () => {
  it('exposes the frozen contract codes without duplicates', () => {
    expect(Object.isFrozen(ACTION_PROCESSING_ERROR_CODES)).toBe(true);
    expect(new Set(ACTION_PROCESSING_ERROR_CODES).size).toBe(ACTION_PROCESSING_ERROR_CODES.length);
    expect(ACTION_PROCESSING_ERROR_CODES).toEqual([
      'invalid_shape',
      'empty_row',
      'unknown_field',
      'invalid_path',
      'invalid_array_index',
      'missing_new_value',
      'missing_path',
      'invalid_array_length',
      'clone_failed',
      'apply_failed',
      'invariant_failed',
    ]);
  });
});

describe('decodeStoredActionRow', () => {
  it('retains the exact raw entry and flattens a valid legacy mixed row in order', () => {
    const rawEntry = [
      {
        op: 'set',
        path: ' Tom.description ',
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

  it('rejects the complete row when one child is malformed', () => {
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
        code: 'invalid_shape',
        message: 'Action operation is invalid',
        rowId: 'row-invalid',
        actionIndex: 1,
        field: 'op',
      },
    });
  });

  it('keeps legacy set-delete compatibility but rejects add without newValue', () => {
    const setResult = decodeStoredActionRow({
      id: 'row-set-delete',
      entry: { op: 'set', path: 'Tom.aliases.0', oldValue: 'alias' },
    });
    const addResult = decodeStoredActionRow({
      id: 'row-add-invalid',
      entry: { op: 'add', path: 'Tom.aliases.0' },
    });

    expect(setResult.success).toBe(true);
    if (setResult.success) {
      expect(setResult.value.actions[0]).toEqual({
        op: 'set',
        path: 'Tom.aliases.0',
        oldValue: 'alias',
        newValue: undefined,
      });
    }
    expect(addResult).toMatchObject({
      success: false,
      error: { code: 'missing_new_value', rowId: 'row-add-invalid', actionIndex: 0 },
    });
  });

  it.each(['', '   ', '.Tom', 'Tom.', 'Tom..description', 'Tom. .description'])(
    'rejects invalid path %p with the row ID',
    (path) => {
      const result = decodeStoredActionRow({
        id: 'row-path-invalid',
        entry: { op: 'delete', path },
      });

      expect(result).toMatchObject({
        success: false,
        error: { code: 'invalid_path', rowId: 'row-path-invalid', actionIndex: 0 },
      });
    }
  );

  it('isolates and freezes raw and normalized values from later caller mutation', () => {
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
    expect(result.value.actions[0]?.newValue).toEqual({ text: 'new' });
    expect(Object.isFrozen(result.value.rawEntry)).toBe(true);
    expect(Object.isFrozen(result.value.actions)).toBe(true);
    expect(Object.isFrozen(result.value.actions[0]?.newValue)).toBe(true);
  });
});

describe('decodeActionRowEntry', () => {
  it('returns canonical single-action output isolated from the raw request', () => {
    const rawEntry = {
      op: 'set',
      path: ' Tom.description ',
      oldValue: { text: 'old' },
      newValue: { text: 'new' },
    };
    const result = decodeActionRowEntry(rawEntry);

    expect(result.success).toBe(true);
    if (!result.success) return;

    rawEntry.path = 'Jerry.description';
    rawEntry.newValue.text = 'changed';

    expect(result.value.canonicalEntry).toEqual({
      op: 'set',
      path: 'Tom.description',
      oldValue: { text: 'old' },
      newValue: { text: 'new' },
    });
    expect(result.value.actions).toEqual([
      {
        op: 'set',
        path: 'Tom.description',
        oldValue: { text: 'old' },
        newValue: { text: 'new' },
      },
    ]);
    expect(Object.isFrozen(result.value.canonicalEntry)).toBe(true);
    expect(Object.isFrozen(result.value.actions[0]?.newValue)).toBe(true);
  });

  it('flattens a mixed array into one canonical action array', () => {
    const result = decodeActionRowEntry([
      { op: 'delete', path: 'Tom.aliases.0', oldValue: 'old' },
      [{ op: 'add', path: 'Tom.aliases.0', newValue: 'new' }],
    ]);

    expect(result).toEqual({
      success: true,
      value: {
        actions: [
          {
            op: 'delete',
            path: 'Tom.aliases.0',
            oldValue: 'old',
            newValue: undefined,
          },
          {
            op: 'add',
            path: 'Tom.aliases.0',
            oldValue: undefined,
            newValue: 'new',
          },
        ],
        canonicalEntry: [
          { op: 'delete', path: 'Tom.aliases.0', oldValue: 'old' },
          { op: 'add', path: 'Tom.aliases.0', newValue: 'new' },
        ],
      },
    });
  });

  it('rejects unknown fields instead of stripping them', () => {
    const result = decodeActionRowEntry({
      op: 'set',
      path: 'Tom.description',
      newValue: 'new',
      unexpected: true,
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: 'unknown_field',
        message: 'Unknown action field: unexpected',
        actionIndex: 0,
        field: 'unexpected',
      },
    });
  });

  it('requires explicit delete instead of set without newValue', () => {
    const result = decodeActionRowEntry({
      op: 'set',
      path: 'Tom.description',
      oldValue: 'old',
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: 'missing_new_value', actionIndex: 0, field: 'newValue' },
    });
    if (!result.success) expect(result.error).not.toHaveProperty('rowId');
  });

  it('rejects empty rows and non-JSON values with stable errors', () => {
    expect(decodeActionRowEntry([])).toMatchObject({
      success: false,
      error: { code: 'empty_row' },
    });
    expect(
      decodeActionRowEntry({ op: 'set', path: 'Tom.description', newValue: new Date() })
    ).toMatchObject({
      success: false,
      error: { code: 'clone_failed' },
    });
    expect(decodeActionRowEntry(Symbol('unclonable'))).toMatchObject({
      success: false,
      error: { code: 'clone_failed' },
    });
  });
});
