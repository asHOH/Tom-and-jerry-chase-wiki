import 'server-only';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';

/**
 * Recorded on 2026-07-24 from the canonical source registry. The complete
 * 1,220,435-byte graph exceeds the conservative one-megabyte compatibility
 * boundary, while the largest domain (characters) is 555,730 bytes.
 */
export const MEASURED_CANONICAL_COMPLETE_SNAPSHOT_BYTES = 1_220_435;
export const MAX_SAFE_COMPLETE_CACHE_BYTES = 1_000_000;
export const PUBLISHED_SNAPSHOT_CACHE_SHAPE = 'per-domain' as const;

export function getCanonicalSerializedBytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

export function createPublishedDomainCacheKey(
  buildIdentity: string,
  actionRevision: string,
  entityType: PublishableEntityType
): string[] {
  return ['published-game-data', 'domain', 'v1', buildIdentity, actionRevision, entityType];
}
