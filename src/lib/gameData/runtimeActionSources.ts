import 'server-only';

import { queryApprovedPublicActionRows } from '@/lib/gameData/publicActionQueries';
import {
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
} from '@/lib/gameData/publicActionsCache';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { PRODUCTION_BUILD_IDENTITY } from '@/lib/gameData/published/buildIdentity';
import {
  createSyncedHistoryArtifactPayload,
  syncedHistoryArtifactToPublicRows,
} from '@/lib/gameData/syncedHistory';
import { querySyncedHistorySource } from '@/lib/gameData/syncedHistorySourceQuery';
import { createCached } from '@/lib/serverCache';
import { getOptionalSupabasePublicClient } from '@/lib/supabase/publicClient';

type Reader<T> = () => Promise<T>;

function singleFlight<T>(reader: Reader<T>): Reader<T> {
  let acquisition: Promise<T> | undefined;

  return () => {
    if (acquisition) return acquisition;

    const current = reader();
    acquisition = current;
    void current.then(
      () => {
        if (acquisition === current) acquisition = undefined;
      },
      () => {
        if (acquisition === current) acquisition = undefined;
      }
    );
    return current;
  };
}

async function queryRuntimeApprovedActionRows(): Promise<PublicActionRow[]> {
  const client = getOptionalSupabasePublicClient();
  if (!client) return [];
  return queryApprovedPublicActionRows(client);
}

async function queryRuntimeSyncedHistoryRows(): Promise<PublicActionRow[]> {
  const client = getOptionalSupabasePublicClient();
  if (!client) return [];

  const source = await querySyncedHistorySource(client);
  return syncedHistoryArtifactToPublicRows(createSyncedHistoryArtifactPayload(source));
}

const readPersistentApprovedActionRows = createCached(
  [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'approved-snapshot', 'v1', PRODUCTION_BUILD_IDENTITY],
  queryRuntimeApprovedActionRows,
  {
    revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
    tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
  }
);

const readPersistentSyncedHistoryRows = createCached(
  [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'synced-history', 'v1', PRODUCTION_BUILD_IDENTITY],
  queryRuntimeSyncedHistoryRows,
  {
    revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
    tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
  }
);

const readCoalescedApprovedActionRows = singleFlight(readPersistentApprovedActionRows);
const readCoalescedFreshApprovedActionRows = singleFlight(queryRuntimeApprovedActionRows);
const readCoalescedSyncedHistoryRows = singleFlight(readPersistentSyncedHistoryRows);

/** Reads the tagged approved replay source and coalesces concurrent cold misses per process. */
export function readCachedApprovedActionRows(): Promise<PublicActionRow[]> {
  return readCoalescedApprovedActionRows();
}

/** Reads the current approved replay source without expiring or populating the shared tagged cache. */
export function readFreshApprovedActionRows(): Promise<PublicActionRow[]> {
  return readCoalescedFreshApprovedActionRows();
}

/** Reads the tagged compact synced-history projection and coalesces concurrent cold misses. */
export function readCachedSyncedHistoryRows(): Promise<PublicActionRow[]> {
  return readCoalescedSyncedHistoryRows();
}
