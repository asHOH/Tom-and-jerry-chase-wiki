import 'server-only';

import { parseApprovedActionArtifactPayload } from '@/lib/gameData/approvedActionArtifact';
import { readBuildGameDataArtifact } from '@/lib/gameData/buildArtifactReader';
import {
  getPublicGameDataDomainCacheTag,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
} from '@/lib/gameData/publicActionsCache';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { PRODUCTION_BUILD_IDENTITY } from '@/lib/gameData/published/buildIdentity';
import {
  readCachedApprovedActionRows,
  readCachedSyncedHistoryRows,
  readFreshApprovedActionRows,
  readFreshSyncedHistoryRows,
} from '@/lib/gameData/runtimeActionSources';
import { cached } from '@/lib/serverCache';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';

import { flattenActionEntries, normalizePublicActionEntries } from './actionEntries';
import { getCharacterRelationActionTargetIds } from './characterRelationActionTargets';
import type { PublicActionRow } from './publicActionsTypes';
import { getGameDataActionEntityKey } from './scopedEntityPaths';
import {
  parseSyncedHistoryArtifactPayload,
  syncedHistoryArtifactToPublicRows,
} from './syncedHistory';

export type EntityUpdateHistory = {
  updatedAt: string;
  actionId: string;
  createdBy: string | null;
  status: string;
  message: string | null;
  reviewedAt: string | null;
  affectedPath: string;
};

function mergeOrderedActionRows(
  approvedRows: readonly PublicActionRow[],
  syncedRows: readonly PublicActionRow[]
): PublicActionRow[] {
  const rowsById = new Map<string, PublicActionRow>();
  for (const row of approvedRows) rowsById.set(row.id, row);
  for (const row of syncedRows) rowsById.set(row.id, row);

  return [...rowsById.values()].sort(
    (left, right) =>
      left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id)
  );
}

async function readApprovedRowsForCurrentContext(fresh = false): Promise<PublicActionRow[]> {
  if (getBuildGameDataArtifactPath()) {
    const artifact = await readBuildGameDataArtifact();
    return parseApprovedActionArtifactPayload(artifact.approvedActions).payload.rows;
  }
  return fresh ? readFreshApprovedActionRows() : readCachedApprovedActionRows();
}

async function readSyncedRowsForCurrentContext(fresh = false): Promise<PublicActionRow[]> {
  if (getBuildGameDataArtifactPath()) {
    const artifact = await readBuildGameDataArtifact();
    return syncedHistoryArtifactToPublicRows(
      parseSyncedHistoryArtifactPayload(artifact.syncedHistory)
    );
  }
  return fresh ? readFreshSyncedHistoryRows() : readCachedSyncedHistoryRows();
}

function extractEntryId(entityType: string, path: string): string | undefined {
  return getGameDataActionEntityKey(entityType, path);
}

export async function getEntityUpdateHistory(): Promise<Map<string, EntityUpdateHistory>> {
  const actions = await fetchPublicGameDataActionHistory();
  const historyMap = new Map<string, EntityUpdateHistory>();

  for (const action of actions) {
    const entries = normalizePublicActionEntries(action.entry);
    for (const entry of flattenActionEntries(entries)) {
      const entryId = extractEntryId(action.entity_type, entry.path);
      if (!entryId) continue;
      const targetIds = new Set([entryId]);
      if (action.entity_type === 'characters') {
        getCharacterRelationActionTargetIds(entry).forEach((id) => targetIds.add(id));
      }

      for (const targetId of targetIds) {
        const historyKey = `${action.entity_type}:${targetId}`;

        const existing = historyMap.get(historyKey);
        const isLaterAction =
          !existing ||
          new Date(action.created_at) > new Date(existing.updatedAt) ||
          (action.created_at === existing.updatedAt &&
            action.id.localeCompare(existing.actionId) > 0);

        if (isLaterAction) {
          historyMap.set(historyKey, {
            updatedAt: action.created_at,
            actionId: action.id,
            createdBy: action.created_by ?? null,
            status: action.status,
            message: action.message ?? null,
            reviewedAt: action.reviewed_at ?? null,
            affectedPath: entry.path,
          });
        }
      }
    }
  }

  return historyMap;
}

export async function fetchPublicGameDataActionHistory(
  entityType?: PublishableEntityType
): Promise<PublicActionRow[]> {
  if (entityType) {
    return cached(
      ['public-domain-history', 'v1', PRODUCTION_BUILD_IDENTITY, entityType],
      async () => {
        const [approvedRows, syncedRows] = await Promise.all([
          readApprovedRowsForCurrentContext(true),
          readSyncedRowsForCurrentContext(true),
        ]);
        return mergeOrderedActionRows(approvedRows, syncedRows).filter(
          (row) => row.entity_type === entityType
        );
      },
      {
        revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
        tags: [getPublicGameDataDomainCacheTag(entityType)],
      }
    );
  }
  const [approvedRows, syncedRows] = await Promise.all([
    readApprovedRowsForCurrentContext(),
    readSyncedRowsForCurrentContext(),
  ]);
  return mergeOrderedActionRows(approvedRows, syncedRows);
}
