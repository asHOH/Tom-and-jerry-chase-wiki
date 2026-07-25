import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import {
  createApprovedActionSnapshot,
  type ApprovedActionSnapshot,
  type ApprovedActionSnapshotRowInput,
} from '@/lib/gameData/published/approvedActionSnapshot';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/data/database.types';

type SnapshotRpcClient = Pick<SupabaseClient<Database>, 'rpc'>;

export class ApprovedReplaySnapshotReadError extends Error {
  readonly code: 'read_failed' | 'invalid_snapshot' | 'decode_failed';

  constructor(code: ApprovedReplaySnapshotReadError['code'], cause?: unknown) {
    super(code, { cause });
    this.name = 'ApprovedReplaySnapshotReadError';
    this.code = code;
  }
}

export type ApprovedReplaySnapshot = {
  replayEpoch: number;
  rows: readonly PublicActionRow[];
  actionSnapshot: ApprovedActionSnapshot;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseRow(value: unknown): PublicActionRow {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.entity_type !== 'string' ||
    typeof value.created_at !== 'string' ||
    typeof value.status !== 'string' ||
    (value.message !== null && typeof value.message !== 'string') ||
    (value.reviewed_at !== null && typeof value.reviewed_at !== 'string') ||
    (value.created_by !== null && typeof value.created_by !== 'string')
  ) {
    throw new ApprovedReplaySnapshotReadError('invalid_snapshot');
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

export async function readApprovedReplaySnapshot(
  client: SnapshotRpcClient = supabaseAdmin
): Promise<ApprovedReplaySnapshot> {
  const { data, error } = await client.rpc('read_game_data_approved_replay_snapshot');
  if (error) throw new ApprovedReplaySnapshotReadError('read_failed', error);
  if (
    data?.length !== 1 ||
    !Number.isSafeInteger(data[0]?.replay_epoch) ||
    data[0]!.replay_epoch < 0 ||
    !Array.isArray(data[0]?.action_rows)
  ) {
    throw new ApprovedReplaySnapshotReadError('invalid_snapshot');
  }

  const rows: PublicActionRow[] = [];
  const snapshotInputs: ApprovedActionSnapshotRowInput[] = [];
  for (const value of data[0].action_rows) {
    const row = parseRow(value);
    const decoded = decodeStoredActionRow(row);
    if (!decoded.success) {
      throw new ApprovedReplaySnapshotReadError('decode_failed', decoded.error);
    }
    const immutableRow = Object.freeze({ ...row, entry: decoded.value.rawEntry });
    rows.push(immutableRow);
    snapshotInputs.push({
      entityType: row.entity_type,
      createdAt: row.created_at,
      status: row.status,
      createdBy: row.created_by,
      message: row.message,
      reviewedAt: row.reviewed_at,
      decodedRow: decoded.value,
    });
  }

  return Object.freeze({
    replayEpoch: data[0].replay_epoch,
    rows: Object.freeze(rows),
    actionSnapshot: createApprovedActionSnapshot(snapshotInputs),
  });
}
