import 'server-only';

import { cache } from 'react';

import { parseApprovedActionArtifactPayload } from '@/lib/gameData/approvedActionArtifact';
import { readBuildGameDataArtifact } from '@/lib/gameData/buildArtifactReader';
import {
  readCachedApprovedActionRows,
  readFreshApprovedActionRows,
} from '@/lib/gameData/runtimeActionSources';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';

import {
  createApprovedActionSnapshotFromRows,
  type ApprovedActionSnapshot,
} from './approvedActionSnapshot';

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
export const getApprovedActionSnapshot = cache(async (): Promise<ApprovedActionSnapshot> =>
  getApprovedActionSnapshotSource()
);

/** Reads the current replay source without expiring the shared public runtime cache. */
export async function getFreshApprovedActionSnapshot(): Promise<ApprovedActionSnapshot> {
  return createApprovedActionSnapshotFromRows(await readFreshApprovedActionRows());
}
