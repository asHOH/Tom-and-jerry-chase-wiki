import 'server-only';

import { revalidateTag } from 'next/cache';

import {
  invalidateCacheAcquisitions,
  MAX_SERVER_CACHE_REVALIDATE_SECONDS,
} from '@/lib/serverCache';

import { isPublishableEntityType, PUBLISHABLE_ENTITY_TYPES } from './publishableEntityTypes';

export const PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG = 'public-game-data-actions';
export const PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS =
  process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview' ? 8 * 60 * 60 : 60 * 60;
export const PENDING_GAME_DATA_ACTIONS_CACHE_TAG = 'pending-game-data-actions';
export const PENDING_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS =
  MAX_SERVER_CACHE_REVALIDATE_SECONDS;

export function getPublicGameDataDomainCacheTag(entityType: string): string {
  return `${PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG}:${entityType}`;
}

/** Expire aggregate readers plus the affected domains; omitted scope means a full refresh. */
export function invalidatePublicGameDataActionsCache(
  entityTypes: readonly string[] = PUBLISHABLE_ENTITY_TYPES
): void {
  const tags = new Set([
    PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
    ...entityTypes.filter(isPublishableEntityType).map(getPublicGameDataDomainCacheTag),
  ]);
  for (const tag of tags) {
    invalidateCacheAcquisitions(tag);
    revalidateTag(tag, { expire: 0 });
  }
}

export function invalidatePendingGameDataActionsCache(): void {
  revalidateTag(PENDING_GAME_DATA_ACTIONS_CACHE_TAG, { expire: 0 });
}
