import { isIP } from 'node:net';

export function getClientIp(request: Request): string | null {
  const candidates = [
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-forwarded-for')?.split(',')[0],
    request.headers.get('x-real-ip'),
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && isIP(value) !== 0) return value;
  }

  return null;
}
