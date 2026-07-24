import type { NextRequest } from 'next/server';

export const getClientIp = (request: Request | NextRequest): string => {
  const headers = request.headers;
  if (!headers) return 'unknown';
  const cf = headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
};
