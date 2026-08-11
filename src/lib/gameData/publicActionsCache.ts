import 'server-only';

import { revalidateTag } from 'next/cache';

export const PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG = 'public-game-data-actions';
export const PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS = 60 * 60;

export function invalidatePublicGameDataActionsCache(): void {
  revalidateTag(PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, { expire: 0 });
}
