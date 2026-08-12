import { Redis } from '@upstash/redis';

import { env } from '@/env';

let redisSingleton: Redis | null | undefined;

function hasUpstashEnv(): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

export function getUpstashRedis(): Redis | null {
  if (!hasUpstashEnv()) {
    return null;
  }

  if (redisSingleton === undefined) {
    redisSingleton = Redis.fromEnv();
  }

  return redisSingleton;
}
