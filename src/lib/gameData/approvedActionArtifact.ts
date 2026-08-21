import 'server-only';

import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';

import {
  createApprovedActionSnapshotFromRows,
  type ApprovedActionSnapshot,
} from './published/approvedActionSnapshot';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export type ApprovedActionArtifactPayload = {
  replayEpoch: number | null;
  rowCount: number;
  checksum: string;
  rows: PublicActionRow[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function parseRow(value: unknown): PublicActionRow {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.entity_type !== 'string' ||
    typeof value.created_at !== 'string' ||
    typeof value.status !== 'string' ||
    !isNullableString(value.message) ||
    !isNullableString(value.reviewed_at) ||
    !isNullableString(value.created_by)
  ) {
    throw new Error('invalid_approved_action_artifact');
  }

  return {
    id: value.id,
    entity_type: value.entity_type,
    entry: value.entry,
    created_at: value.created_at,
    status: value.status,
    message: value.message,
    reviewed_at: value.reviewed_at,
    created_by: value.created_by,
  };
}

function checksumForSnapshot(snapshot: ApprovedActionSnapshot): string {
  return snapshot.actionRevision.slice('v1:'.length);
}

function validateOrderedUniqueRows(rows: readonly PublicActionRow[]): void {
  const ids = new Set<string>();
  let previous: PublicActionRow | undefined;

  for (const row of rows) {
    if (ids.has(row.id)) throw new Error('duplicate_approved_action_artifact_row');
    ids.add(row.id);
    if (
      previous &&
      (previous.created_at > row.created_at ||
        (previous.created_at === row.created_at && previous.id >= row.id))
    ) {
      throw new Error('unordered_approved_action_artifact_rows');
    }
    previous = row;
  }
}

export function createApprovedActionArtifactPayload(
  replayEpoch: number | null,
  exactCount: number,
  rows: readonly PublicActionRow[]
): ApprovedActionArtifactPayload {
  if (
    (replayEpoch !== null && (!Number.isSafeInteger(replayEpoch) || replayEpoch < 0)) ||
    !Number.isSafeInteger(exactCount) ||
    exactCount < 0 ||
    exactCount !== rows.length
  ) {
    throw new Error('incomplete_approved_action_artifact');
  }

  validateOrderedUniqueRows(rows);
  const copiedRows = rows.map((row) => ({ ...row }));
  const snapshot = createApprovedActionSnapshotFromRows(copiedRows);
  return {
    replayEpoch,
    rowCount: copiedRows.length,
    checksum: checksumForSnapshot(snapshot),
    rows: copiedRows,
  };
}

export function parseApprovedActionArtifactPayload(value: unknown): {
  payload: ApprovedActionArtifactPayload;
  snapshot: ApprovedActionSnapshot;
} {
  if (
    !isRecord(value) ||
    (value.replayEpoch !== null &&
      (typeof value.replayEpoch !== 'number' ||
        !Number.isSafeInteger(value.replayEpoch) ||
        value.replayEpoch < 0)) ||
    typeof value.rowCount !== 'number' ||
    !Number.isSafeInteger(value.rowCount) ||
    value.rowCount < 0 ||
    typeof value.checksum !== 'string' ||
    !SHA256_PATTERN.test(value.checksum) ||
    !Array.isArray(value.rows)
  ) {
    throw new Error('invalid_approved_action_artifact');
  }

  const rows = value.rows.map(parseRow);
  if (value.rowCount !== rows.length) throw new Error('incomplete_approved_action_artifact');
  validateOrderedUniqueRows(rows);
  const snapshot = createApprovedActionSnapshotFromRows(rows);
  if (value.checksum !== checksumForSnapshot(snapshot)) {
    throw new Error('invalid_approved_action_artifact_checksum');
  }

  return {
    payload: {
      replayEpoch: value.replayEpoch,
      rowCount: value.rowCount,
      checksum: value.checksum,
      rows,
    },
    snapshot,
  };
}
