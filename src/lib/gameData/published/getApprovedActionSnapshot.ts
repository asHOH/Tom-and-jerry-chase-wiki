import 'server-only';

import { cache } from 'react';

import { parseApprovedActionArtifactPayload } from '@/lib/gameData/approvedActionArtifact';
import { readBuildGameDataArtifact } from '@/lib/gameData/buildArtifactReader';
import {
  getPublicGameDataDomainCacheTag,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
} from '@/lib/gameData/publicActionsCache';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import {
  readCachedApprovedActionRows,
  readFreshApprovedActionRows,
} from '@/lib/gameData/runtimeActionSources';
import { cached } from '@/lib/serverCache';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';

import {
  createApprovedActionRevision,
  createApprovedActionSnapshotFromRows,
  type ApprovedActionSnapshot,
} from './approvedActionSnapshot';
import { PRODUCTION_BUILD_IDENTITY } from './buildIdentity';

async function getApprovedActionSnapshotSource(): Promise<ApprovedActionSnapshot> {
  if (getBuildGameDataArtifactPath()) {
    const artifact = await readBuildGameDataArtifact();
    return parseApprovedActionArtifactPayload(artifact.approvedActions).snapshot;
  }
  return createApprovedActionSnapshotFromRows(await readCachedApprovedActionRows());
}

/**
 * Acquires one immutable, ordered, normalized approved-row view for the current
 * server render. Consumers should pass this value through their selector chain
 * instead of independently reading approved rows.
 */
export const getApprovedActionSnapshot = cache(
  async (...entityTypes: PublishableEntityType[]): Promise<ApprovedActionSnapshot> => {
    if (entityTypes.length === 0) return getApprovedActionSnapshotSource();

    const scope = [...new Set(entityTypes)].sort();
    const scopedTypes = new Set<string>(scope);
    return cached(
      ['approved-domain-snapshot', 'v1', PRODUCTION_BUILD_IDENTITY, ...scope],
      async () => {
        // Keep the aggregate acquisition inside this cache boundary, so its global tag
        // does not become a dependency of every page. Runtime fills use fresh rows.
        const snapshot = getBuildGameDataArtifactPath()
          ? await getApprovedActionSnapshotSource()
          : await getFreshApprovedActionSnapshot();
        const rows = Object.freeze(snapshot.rows.filter((row) => scopedTypes.has(row.entityType)));
        return Object.freeze({ actionRevision: createApprovedActionRevision(rows), rows });
      },
      {
        revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
        tags: scope.map(getPublicGameDataDomainCacheTag),
      }
    );
  }
);

/** Reads the current replay source without expiring the shared public runtime cache. */
export async function getFreshApprovedActionSnapshot(): Promise<ApprovedActionSnapshot> {
  return createApprovedActionSnapshotFromRows(await readFreshApprovedActionRows());
}
