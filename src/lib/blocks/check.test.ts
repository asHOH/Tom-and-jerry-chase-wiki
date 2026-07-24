import { getRequestIp, normalizeIp } from './check';

describe('block request IP helpers', () => {
  it.each([
    ['203.0.113.9', '203.0.113.9'],
    ['2001:db8::9', '2001:db8::9'],
    [' unknown ', null],
    [null, null],
  ])('normalizes %s', (value, expected) => {
    expect(normalizeIp(value)).toBe(expected);
  });

  it('uses the trusted proxy header order', () => {
    const request = {
      headers: {
        get: (name: string) =>
          name === 'cf-connecting-ip'
            ? '2001:db8::1'
            : name === 'x-forwarded-for'
              ? '203.0.113.1, 203.0.113.2'
              : null,
      },
    } as unknown as Request;

    expect(getRequestIp(request)).toBe('2001:db8::1');
  });
});
