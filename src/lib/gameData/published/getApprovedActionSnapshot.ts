import 'server-only';

import { cache } from 'react';

import { queryApprovedPublicActionRows } from '@/lib/gameData/publicActionQueries';
import { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActionsCache';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { cached } from '@/lib/serverCache';
import { getOptionalSupabasePublicClient } from '@/lib/supabase/publicClient';

import {
  createApprovedActionSnapshotFromRows,
  type ApprovedActionSnapshot,
} from './approvedActionSnapshot';
import { PRODUCTION_BUILD_IDENTITY } from './buildIdentity';

async function getCachedApprovedRows(): Promise<PublicActionRow[]> {
  const client = getOptionalSupabasePublicClient();
  if (!client) return [];

  return cached(
    [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'approved-snapshot', 'v1', PRODUCTION_BUILD_IDENTITY],
    () => queryApprovedPublicActionRows(client),
    {
      revalidate: false,
      tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
    }
  );
}

/**
 * Acquires one immutable, ordered, normalized approved-row view for the current
 * server render. Consumers should pass this value through their selector chain
 * instead of independently reading approved rows.
 */
export const getApprovedActionSnapshot = cache(async (): Promise<ApprovedActionSnapshot> =>
  createApprovedActionSnapshotFromRows(await getCachedApprovedRows())
);
