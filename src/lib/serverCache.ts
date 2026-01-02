import 'server-only';

import { unstable_cache } from 'next/cache';

export type ServerCacheOptions = {
  revalidate?: number | false;
  tags?: string[];
};

function normalizeKeyParts(
  keyParts: Array<string | number | boolean | null | undefined>
): string[] {
  return keyParts.map((p) => String(p ?? 'null'));
}

/**
 * Caches the result across requests using Next.js Data Cache.
 *
 * Use ONLY for public/anonymous data (never user-specific) unless your key includes user identity.
 */
export async function cached<T>(
  keyParts: Array<string | number | boolean | null | undefined>,
  fn: () => Promise<T>,
  options?: ServerCacheOptions
): Promise<T> {
  const key = normalizeKeyParts(keyParts);
  const wrapped = unstable_cache(fn, key, options);
  return wrapped();
}
