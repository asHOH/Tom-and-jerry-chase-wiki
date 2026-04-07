import 'server-only';

import { unstable_cache } from 'next/cache';

import { env } from '@/env';

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

  const resourceType = String(keyParts[0] ?? 'unknown');
  const defaultRevalidate = resourceType === 'articles' ? 30 : 300;

  let revalidate: number | false | undefined = options?.revalidate;
  if (revalidate === undefined) {
    revalidate = defaultRevalidate;
  }

  const shouldDisableRevalidate = env.VERCEL === '1' && env.VERCEL_ENV === 'preview';
  if (shouldDisableRevalidate) {
    revalidate = false;
  }

  const normalizedOptions = { ...options, revalidate };

  const wrapped = unstable_cache(fn, key, normalizedOptions);
  return wrapped();
}
