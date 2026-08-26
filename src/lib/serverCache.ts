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

const cacheAcquisitions = new Map<string, Promise<unknown>>();

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

  // Tags can invalidate sooner, but a missed invalidation must not retain data
  // beyond the project's maximum cache lifetime.
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
  const activeAcquisition = cacheAcquisitions.get(acquisitionKey) as Promise<T> | undefined;
  if (activeAcquisition) return activeAcquisition;

  const acquisition = createCached(keyParts, fn, options)();
  cacheAcquisitions.set(acquisitionKey, acquisition);
  const clearAcquisition = () => {
    if (cacheAcquisitions.get(acquisitionKey) === acquisition) {
      cacheAcquisitions.delete(acquisitionKey);
    }
  };
  void acquisition.then(clearAcquisition, clearAcquisition);
  return acquisition;
}
