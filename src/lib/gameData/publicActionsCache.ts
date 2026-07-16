import 'server-only';

import { revalidateTag } from 'next/cache';

export const PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG = 'public-game-data-actions';

export function invalidatePublicGameDataActionsCache(): void {
  revalidateTag(PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, { expire: 0 });
}
