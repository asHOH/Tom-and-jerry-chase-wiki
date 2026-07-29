import 'server-only';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';

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
