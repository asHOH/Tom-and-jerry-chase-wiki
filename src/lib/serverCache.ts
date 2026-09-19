import 'server-only';

import { unstable_cache } from 'next/cache';

export type ServerCacheOptions = {
  revalidate?: number | false;
  tags?: string[];
};

export const MAX_SERVER_CACHE_REVALIDATE_SECONDS = 12 * 60 * 60;

function normalizeKeyParts(
  keyParts: Array<string | number | boolean | null | undefined>
): string[] {
  return keyParts.map((p) => String(p ?? 'null'));
}

const cacheAcquisitions = new Map<string, { promise: Promise<unknown>; tags: readonly string[] }>();

export function invalidateCacheAcquisitions(tag: string): void {
  for (const [key, acquisition] of cacheAcquisitions) {
    if (acquisition.tags.includes(tag)) cacheAcquisitions.delete(key);
  }
}

/**
 * Caches the result across requests using Next.js Data Cache.
 *
 * Use ONLY for public/anonymous data (never user-specific) unless your key includes user identity.
 */
export function createCached<T>(
  keyParts: Array<string | number | boolean | null | undefined>,
  fn: () => Promise<T>,
  options?: ServerCacheOptions
): () => Promise<T> {
  const key = normalizeKeyParts(keyParts);

  const resourceType = String(keyParts[0] ?? 'unknown');
  const defaultRevalidate = resourceType === 'articles' ? 30 : 300;

  let revalidate: number | false | undefined = options?.revalidate;
  if (revalidate === undefined) {
    revalidate = defaultRevalidate;
  }

  // Cap the revalidation interval, not observable staleness: background refresh
  // may still serve the previous value until a successful revalidation.
  revalidate =
    revalidate === false
      ? MAX_SERVER_CACHE_REVALIDATE_SECONDS
      : Math.min(revalidate, MAX_SERVER_CACHE_REVALIDATE_SECONDS);

  const normalizedOptions = { ...options, revalidate };

  return unstable_cache(fn, key, normalizedOptions);
}

export function cached<T>(
  keyParts: Array<string | number | boolean | null | undefined>,
  fn: () => Promise<T>,
  options?: ServerCacheOptions
): Promise<T> {
  const acquisitionKey = JSON.stringify(normalizeKeyParts(keyParts));
  const activeAcquisition = cacheAcquisitions.get(acquisitionKey);
  if (activeAcquisition) return activeAcquisition.promise as Promise<T>;

  const acquisition = createCached(keyParts, fn, options)();
  cacheAcquisitions.set(acquisitionKey, { promise: acquisition, tags: options?.tags ?? [] });
  const clearAcquisition = () => {
    if (cacheAcquisitions.get(acquisitionKey)?.promise === acquisition) {
      cacheAcquisitions.delete(acquisitionKey);
    }
  };
  void acquisition.then(clearAcquisition, clearAcquisition);
  return acquisition;
}
