import { Redis } from '@upstash/redis';

let redisSingleton: Redis | null | undefined;

function hasUpstashEnv(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
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
