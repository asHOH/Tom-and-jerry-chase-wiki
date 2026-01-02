import type { NextRequest } from 'next/server';
import { Ratelimit, type Duration } from '@upstash/ratelimit';

import { getUpstashRedis } from './upstash';

export type RateLimitProfile = 'auth' | 'read' | 'write' | 'expensive';

type ProfileConfig = {
  limit: number;
  window: Duration;
};

const PROFILE_CONFIG: Record<RateLimitProfile, ProfileConfig> = {
  auth: { limit: 10, window: '1 m' },
  read: { limit: 120, window: '1 m' },
  write: { limit: 30, window: '1 m' },
  expensive: { limit: 6, window: '1 m' },
};

const ratelimitSingletons = new Map<RateLimitProfile, Ratelimit>();
const cache = new Map();

function getRatelimit(profile: RateLimitProfile): Ratelimit | null {
  const redis = getUpstashRedis();
  if (!redis) {
    return null;
  }

  const existing = ratelimitSingletons.get(profile);
  if (existing) {
    return existing;
  }

  const config = PROFILE_CONFIG[profile];
  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    analytics: true,
    enableProtection: true,
    prefix: 'tjcw:ratelimit',
    ephemeralCache: cache,
  });

  ratelimitSingletons.set(profile, instance);
  return instance;
}

export function getClientIp(request: Request | NextRequest): string {
  const headers = request.headers;
  const cf = headers.get('cf-connecting-ip');
  if (cf) {
    return cf.trim();
  }

  const xff = headers.get('x-forwarded-for');
  if (xff) {
    // May contain a comma-separated list; take the first hop.
    const first = xff.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

export async function checkRateLimit(
  request: Request | NextRequest,
  profile: RateLimitProfile,
  bucket: string
): Promise<
  { allowed: true } | { allowed: false; headers: Record<string, string>; retryAfterSeconds: number }
> {
  const ratelimit = getRatelimit(profile);
  if (!ratelimit) {
    return { allowed: true };
  }

  const ip = getClientIp(request);
  const identifier = `${profile}:${bucket}:${ip}`;

  const result = await ratelimit.limit(identifier);
  if (result.success) {
    return { allowed: true };
  }

  const resetMs = typeof result.reset === 'number' ? result.reset : Date.now();
  const retryAfterSeconds = Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));

  return {
    allowed: false,
    retryAfterSeconds,
    headers: {
      'Retry-After': String(retryAfterSeconds),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.reset),
    },
  };
}
