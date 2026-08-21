import 'server-only';

import { cache } from 'react';

import { parseApprovedActionArtifactPayload } from '@/lib/gameData/approvedActionArtifact';
import { readBuildGameDataArtifact } from '@/lib/gameData/buildArtifactReader';
import { queryApprovedPublicActionRows } from '@/lib/gameData/publicActionQueries';
import {
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
} from '@/lib/gameData/publicActionsCache';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { cached } from '@/lib/serverCache';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';
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
      revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
      tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
    }
  );
}

async function getApprovedActionSnapshotSource(): Promise<ApprovedActionSnapshot> {
  if (getBuildGameDataArtifactPath()) {
    const artifact = await readBuildGameDataArtifact();
    return parseApprovedActionArtifactPayload(artifact.approvedActions).snapshot;
  }
  return createApprovedActionSnapshotFromRows(await getCachedApprovedRows());
}

/**
 * Acquires one immutable, ordered, normalized approved-row view for the current
 * server render. Consumers should pass this value through their selector chain
 * instead of independently reading approved rows.
 */
export const getApprovedActionSnapshot = cache(async (): Promise<ApprovedActionSnapshot> =>
  getApprovedActionSnapshotSource()
);
