import { parseActionPath, resolveArraySegment, shouldCreateArrayForSegment } from './actionPath';

describe('parseActionPath', () => {
  it('trims outer whitespace and preserves valid segments', () => {
    expect(parseActionPath(' Tom.aliases.0 ')).toEqual({
      success: true,
      value: {
        path: 'Tom.aliases.0',
        segments: ['Tom', 'aliases', '0'],
        rootKey: 'Tom',
      },
    });
  });

  it.each(['', '   ', '.Tom', 'Tom.', 'Tom..aliases', 'Tom. .aliases'])(
    'rejects invalid path %p',
    (path) => {
      expect(parseActionPath(path)).toMatchObject({
        success: false,
        error: { code: 'invalid_path' },
      });
    }
  );

  it.each(['__proto__.polluted', 'Tom.constructor.prototype', 'Tom.prototype.name'])(
    'rejects prototype-mutating path %p',
    (path) => {
      expect(parseActionPath(path)).toMatchObject({
        success: false,
        error: { code: 'invalid_path' },
      });
    }
  );
});

describe('resolveArraySegment', () => {
  it.each([
    ['0', 0],
    ['1', 1],
    ['4294967294', 4294967294],
  ])('resolves canonical index %s', (segment, index) => {
    expect(resolveArraySegment(segment)).toEqual({
      success: true,
      value: { kind: 'index', index },
    });
  });

  it.each(['01', '-1', '+1', '1.5', '1e2', '0x10', '4294967295', 'Infinity', 'NaN'])(
    'rejects non-canonical numeric segment %s',
    (segment) => {
      expect(resolveArraySegment(segment, 2)).toEqual({
        success: false,
        error: {
          code: 'invalid_array_index',
          message: `Invalid array index segment: ${segment}`,
          segment,
          segmentIndex: 2,
        },
      });
    }
  );

  it('keeps nonnumeric array properties as properties', () => {
    expect(resolveArraySegment('length')).toEqual({
      success: true,
      value: { kind: 'property', key: 'length' },
    });
    expect(shouldCreateArrayForSegment('2')).toEqual({ success: true, value: true });
    expect(shouldCreateArrayForSegment('name')).toEqual({ success: true, value: false });
  });
});
