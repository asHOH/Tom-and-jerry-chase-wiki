import { getClientIp } from './clientIp';

function requestWith(headers: Record<string, string>) {
  return {
    headers: { get: (name: string) => headers[name] ?? null },
  } as Request;
}

describe('getClientIp', () => {
  it('should prefer a valid Cloudflare address', () => {
    expect(
      getClientIp(
        requestWith({
          'cf-connecting-ip': '203.0.113.4',
          'x-forwarded-for': '198.51.100.2',
        })
      )
    ).toBe('203.0.113.4');
  });

  it('should use the first forwarded address and support IPv6', () => {
    expect(getClientIp(requestWith({ 'x-forwarded-for': '2001:db8::1, 198.51.100.2' }))).toBe(
      '2001:db8::1'
    );
  });

  it('should fall back after invalid values and reject a missing address', () => {
    expect(
      getClientIp(requestWith({ 'cf-connecting-ip': 'invalid', 'x-real-ip': '192.0.2.8' }))
    ).toBe('192.0.2.8');
    expect(getClientIp(requestWith({}))).toBeNull();
  });
});
