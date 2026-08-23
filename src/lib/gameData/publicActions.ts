import 'server-only';

import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';
import { parseApprovedActionArtifactPayload } from '@/lib/gameData/approvedActionArtifact';
import { readBuildGameDataArtifact } from '@/lib/gameData/buildArtifactReader';
import {
  readCachedApprovedActionRows,
  readCachedSyncedHistoryRows,
} from '@/lib/gameData/runtimeActionSources';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';

import { normalizePublicActionEntries } from './actionEntries';
import { PublicActionQueryError } from './publicActionQueries';
import type { PublicActionRow } from './publicActionsTypes';
import { getGameDataActionEntityKey } from './scopedEntityPaths';
import {
  parseSyncedHistoryArtifactPayload,
  syncedHistoryArtifactToPublicRows,
} from './syncedHistory';

export { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActionsCache';

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

async function readApprovedRowsForCurrentContext(): Promise<PublicActionRow[]> {
  if (getBuildGameDataArtifactPath()) {
    const artifact = await readBuildGameDataArtifact();
    return parseApprovedActionArtifactPayload(artifact.approvedActions).payload.rows;
  }
  return readCachedApprovedActionRows();
}

async function readSyncedRowsForCurrentContext(): Promise<PublicActionRow[]> {
  if (getBuildGameDataArtifactPath()) {
    const artifact = await readBuildGameDataArtifact();
    return syncedHistoryArtifactToPublicRows(
      parseSyncedHistoryArtifactPayload(artifact.syncedHistory)
    );
  }
  return readCachedSyncedHistoryRows();
}

function extractActionPaths(entry: ActionHistoryEntry): string[] {
  if (Array.isArray(entry)) {
    const paths: string[] = [];
    for (const action of entry) {
      if (action.path) paths.push(action.path);
    }
    return paths;
  }
  return entry.path ? [entry.path] : [];
}

function extractEntryId(entityType: string, path: string): string | undefined {
  return getGameDataActionEntityKey(entityType, path);
}

export async function getEntityUpdateHistory(): Promise<Map<string, EntityUpdateHistory>> {
  const actions = await fetchPublicGameDataActionHistory();
  const historyMap = new Map<string, EntityUpdateHistory>();

  for (const action of actions) {
    const entries = normalizePublicActionEntries(action.entry);
    for (const entry of entries) {
      const paths = extractActionPaths(entry);
      for (const path of paths) {
        const entryId = extractEntryId(action.entity_type, path);
        if (!entryId) continue;

        const historyKey = `${action.entity_type}:${entryId}`;

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
            affectedPath: path,
          });
        }
      }
    }
  }

  return historyMap;
}

export async function fetchPublicGameDataActionHistory(): Promise<PublicActionRow[]> {
  try {
    const [approvedRows, syncedRows] = await Promise.all([
      readApprovedRowsForCurrentContext(),
      readSyncedRowsForCurrentContext(),
    ]);
    return mergeOrderedActionRows(approvedRows, syncedRows);
  } catch (error) {
    console.error(
      'Error fetching public game data action history:',
      error instanceof PublicActionQueryError ? error.cause : error
    );
    return [];
  }
}

export async function fetchPublicGameDataActions(): Promise<PublicActionRow[]> {
  try {
    return await readApprovedRowsForCurrentContext();
  } catch (error) {
    console.error(
      'Error fetching public game data actions:',
      error instanceof PublicActionQueryError ? error.cause : error
    );
    return [];
  }
}
