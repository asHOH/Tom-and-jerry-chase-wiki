import 'server-only';

import { revalidateTag } from 'next/cache';

import { MAX_SERVER_CACHE_REVALIDATE_SECONDS } from '@/lib/serverCache';

export const PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG = 'public-game-data-actions';
export const PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS = 60 * 60;
export const PENDING_GAME_DATA_ACTIONS_CACHE_TAG = 'pending-game-data-actions';
export const PENDING_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS =
  MAX_SERVER_CACHE_REVALIDATE_SECONDS;

export function invalidatePublicGameDataActionsCache(): void {
  revalidateTag(PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, { expire: 0 });
}

export function invalidatePendingGameDataActionsCache(): void {
  revalidateTag(PENDING_GAME_DATA_ACTIONS_CACHE_TAG, { expire: 0 });
}
