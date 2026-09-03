import 'server-only';

import { createHash } from 'node:crypto';

import { canAccessAll, type PermissionGrant } from '@/lib/auth/permissions';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import {
  validateApprovedCandidateReplay,
  type ApprovedCandidateReplayRow,
} from '@/lib/gameData/approvedCandidateReplay';
import {
  readApprovedReplaySnapshot,
  type ApprovedReplaySnapshot,
} from '@/lib/gameData/approvedReplaySnapshotReader';
import {
  invalidatePendingGameDataActionsCache,
  invalidatePublicGameDataActionsCache,
} from '@/lib/gameData/publicActionsCache';
import { getPublishOperationFingerprint } from '@/lib/gameData/publishOperation';
import type { PreparedPublishRequest } from '@/lib/gameData/publishPreparation';
import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import type { Database, Json } from '@/data/database.types';

type PublishPermission = 'game_data_action.create' | 'game_data_action.publish_relations';
type ActionStatus = Database['public']['Enums']['game_data_action_status'];

export type TrustedGameDataActionRecord = {
  id: string;
  entity_type: string;
  entry: Json;
  created_at: string;
  created_by: string | null;
  status: ActionStatus;
  is_public: boolean;
};

export type TrustedPublishResult = {
  id: string;
  is_public: boolean;
  status: ActionStatus;
};

export class TrustedGameDataMutationError extends Error {
  readonly code:
    | 'not_found'
    | 'load_failed'
    | 'forbidden'
    | 'invalid_row'
    | 'candidate_conflict'
    | 'replay_epoch_conflict'
    | 'idempotency_key_reused'
    | 'persistence_failed';

  constructor(code: TrustedGameDataMutationError['code'], cause?: unknown) {
    super(code, { cause });
    this.name = 'TrustedGameDataMutationError';
    this.code = code;
  }
}

function asJson(value: unknown): Json {
  return value as Json;
}

function candidateRows(snapshot: ApprovedReplaySnapshot): ApprovedCandidateReplayRow[] {
  return snapshot.actionSnapshot.rows.map((row) => ({
    rowId: row.rowId,
    entityType: row.entityType,
    actions: row.actions,
  }));
}

function validateCandidate(rows: readonly ApprovedCandidateReplayRow[]): void {
  try {
    validateApprovedCandidateReplay(rows);
  } catch (error) {
    throw new TrustedGameDataMutationError('candidate_conflict', error);
  }
}

function persistenceError(error: {
  code?: string;
  message?: string;
}): TrustedGameDataMutationError {
  if (error.code === '40001' || error.message?.includes('approved_replay_epoch_conflict')) {
    return new TrustedGameDataMutationError('replay_epoch_conflict', error);
  }
  if (error.message?.includes('idempotency_key_reused')) {
    return new TrustedGameDataMutationError('idempotency_key_reused', error);
  }
  return new TrustedGameDataMutationError('persistence_failed', error);
}

function operationFingerprint(options: {
  permission: PublishPermission;
  prepared: PreparedPublishRequest;
  submitMode?: GameDataSubmitMode;
}): string {
  return createHash('sha256')
    .update(
      getPublishOperationFingerprint({
        version: 1,
        permission: options.permission,
        submitMode: options.submitMode ?? 'default',
        message: options.prepared.message ?? null,
        actions: options.prepared.actions.map((action) => ({
          entityType: action.entityType,
          entries: action.rows.map((row) => row.canonicalEntry),
        })),
      }),
      'utf8'
    )
    .digest('hex');
}

async function readExistingPublishOperation(options: {
  operationId: string;
  fingerprint: string;
}): Promise<TrustedPublishResult[] | null> {
  const client = requireSupabaseAdminClient();
  const operationResult = await client
    .from('game_data_action_publish_operations')
    .select('request_fingerprint')
    .eq('operation_id', options.operationId)
    .maybeSingle();
  if (operationResult.error) throw persistenceError(operationResult.error);
  if (!operationResult.data) return null;

  if (operationResult.data.request_fingerprint !== options.fingerprint) {
    throw new TrustedGameDataMutationError('idempotency_key_reused');
  }

  const rowsResult = await client
    .from('game_data_actions')
    .select('id, publish_operation_initial_public, publish_operation_initial_status')
    .eq('publish_operation_id', options.operationId)
    .order('publish_operation_ordinal', { ascending: true });
  if (rowsResult.error) throw persistenceError(rowsResult.error);

  const rows = (rowsResult.data ?? []).map((row) => {
    if (
      row.publish_operation_initial_public === null ||
      row.publish_operation_initial_public === undefined ||
      row.publish_operation_initial_status === null ||
      row.publish_operation_initial_status === undefined
    ) {
      throw new TrustedGameDataMutationError('persistence_failed');
    }
    return {
      id: row.id,
      is_public: row.publish_operation_initial_public,
      status: row.publish_operation_initial_status,
    };
  });
  if (rows.length === 0) throw new TrustedGameDataMutationError('persistence_failed');
  return rows;
}

async function publishWithOperation(options: {
  operationId: string;
  fingerprint: string;
  actorId: string | null;
  permission: PublishPermission;
  prepared: PreparedPublishRequest;
  expectedEpoch: number;
  clientIp?: string | null;
  submitMode?: GameDataSubmitMode;
}): Promise<TrustedPublishResult[]> {
  const { data, error } = await requireSupabaseAdminClient().rpc(
    'prepared_publish_game_data_actions_request',
    {
      p_operation_id: options.operationId,
      p_request_fingerprint: options.fingerprint,
      p_actor_id: options.actorId,
      p_permission_key: options.permission,
      p_actions: options.prepared.actions.map((action) => ({
        entity_type: action.entityType,
        entries: action.rows.map((row) => asJson(row.canonicalEntry)),
      })),
      p_message: options.prepared.message ?? null,
      p_expected_replay_epoch: options.expectedEpoch,
      p_submit_mode: options.submitMode ?? 'default',
      ...(options.clientIp === undefined ? {} : { p_ip: options.clientIp }),
    }
  );
  if (error) throw persistenceError(error);
  return data ?? [];
}

export async function loadTrustedGameDataAction(
  actionId: string
): Promise<TrustedGameDataActionRecord> {
  const { data, error } = await requireSupabaseAdminClient()
    .from('game_data_actions')
    .select('id, entity_type, entry, created_at, created_by, status, is_public')
    .eq('id', actionId)
    .maybeSingle();
  if (error) throw new TrustedGameDataMutationError('load_failed', error);
  if (!data) throw new TrustedGameDataMutationError('not_found');
  return data;
}

export async function publishPreparedGameDataActions(options: {
  actorId: string | null;
  clientIp?: string | null;
  permission: PublishPermission;
  grants: readonly PermissionGrant[];
  prepared: PreparedPublishRequest;
  submitMode?: GameDataSubmitMode;
  operationId?: string;
}): Promise<TrustedPublishResult[]> {
  const actorId = options.actorId;
  const isAnonymous = actorId === null;
  if (isAnonymous && options.permission !== 'game_data_action.create') {
    throw new TrustedGameDataMutationError('forbidden');
  }

  const fingerprint = operationFingerprint(options);
  if (options.operationId) {
    const existing = await readExistingPublishOperation({
      operationId: options.operationId,
      fingerprint,
    });
    if (existing) {
      if (existing.some((result) => result.is_public)) invalidatePublicGameDataActionsCache();
      if (existing.some((result) => result.status === 'pending')) {
        invalidatePendingGameDataActionsCache();
      }
      return existing;
    }
  }

  const proposedApprovedRows: ApprovedCandidateReplayRow[] = [];

  for (const action of options.prepared.actions) {
    // Permission grants can change between this route-owned snapshot and the RPC's mandatory
    // database recheck. We intentionally accept that narrow race instead of adding a second
    // approval expectation token; the RPC remains the final authorization authority.
    let autoPublishesAction = options.submitMode !== 'force_pending';
    const actionCandidateRows: ApprovedCandidateReplayRow[] = [];
    for (const [rowIndex, row] of action.rows.entries()) {
      const entry = asJson(row.canonicalEntry);
      const contexts = getGameActionResourceContexts(action.entityType, [entry]);
      if (!isAnonymous && !canAccessAll(options.grants, options.permission, contexts)) {
        throw new TrustedGameDataMutationError('forbidden');
      }
      autoPublishesAction &&=
        !isAnonymous && canAccessAll(options.grants, 'game_data_action.auto_approve', contexts);
      actionCandidateRows.push({
        rowId: `proposed:${action.entityType}:${rowIndex}`,
        entityType: action.entityType,
        actions: row.actions,
      });
    }
    if (!isAnonymous && autoPublishesAction) proposedApprovedRows.push(...actionCandidateRows);
  }

  const snapshot = await readApprovedReplaySnapshot();
  validateCandidate([...candidateRows(snapshot), ...proposedApprovedRows]);

  if (options.operationId) {
    const results = await publishWithOperation({
      operationId: options.operationId,
      fingerprint,
      actorId,
      permission: options.permission,
      prepared: options.prepared,
      expectedEpoch: snapshot.replayEpoch,
      ...(options.clientIp === undefined ? {} : { clientIp: options.clientIp }),
      ...(options.submitMode === undefined ? {} : { submitMode: options.submitMode }),
    });
    if (results.some((result) => result.is_public)) {
      invalidatePublicGameDataActionsCache();
    }
    if (results.some((result) => result.status === 'pending')) {
      invalidatePendingGameDataActionsCache();
    }
    return results;
  }

  // Legacy cached clients omit the key and remain on the historical non-idempotent path.
  const results: TrustedPublishResult[] = [];
  let expectedEpoch = snapshot.replayEpoch;
  for (const action of options.prepared.actions) {
    const rpcResult = isAnonymous
      ? await requireSupabaseAdminClient().rpc('prepared_publish_anonymous_game_data_actions', {
          p_entity_type: action.entityType,
          p_entries: action.rows.map((row) => asJson(row.canonicalEntry)),
          p_message: options.prepared.message ?? null,
          p_expected_replay_epoch: expectedEpoch,
          ...(options.clientIp === undefined ? {} : { p_ip: options.clientIp }),
        })
      : await requireSupabaseAdminClient().rpc('prepared_publish_game_data_actions', {
          p_actor_id: actorId,
          p_permission_key: options.permission,
          p_entity_type: action.entityType,
          p_entries: action.rows.map((row) => asJson(row.canonicalEntry)),
          p_message: options.prepared.message ?? null,
          p_expected_replay_epoch: expectedEpoch,
          p_submit_mode: options.submitMode ?? 'default',
          ...(options.clientIp === undefined ? {} : { p_ip: options.clientIp }),
        });
    const { data, error } = rpcResult;
    if (error) throw persistenceError(error);
    const actionResults = data ?? [];
    results.push(...actionResults);
    expectedEpoch += actionResults.filter((result) => result.is_public).length;
  }

  if (results.some((result) => result.is_public)) {
    invalidatePublicGameDataActionsCache();
  }
  if (results.some((result) => result.status === 'pending')) {
    invalidatePendingGameDataActionsCache();
  }
  return results;
}

function decodedCandidateRow(record: TrustedGameDataActionRecord): ApprovedCandidateReplayRow {
  const decoded = decodeStoredActionRow(record);
  if (!decoded.success) throw new TrustedGameDataMutationError('invalid_row', decoded.error);
  return {
    rowId: record.id,
    entityType: record.entity_type,
    actions: decoded.value.actions,
  };
}

function insertCandidateInSemanticOrder(
  snapshot: ApprovedReplaySnapshot,
  record: TrustedGameDataActionRecord
): ApprovedCandidateReplayRow[] {
  const byId = new Map<string, ApprovedCandidateReplayRow>(
    snapshot.actionSnapshot.rows.map((row) => [row.rowId, row])
  );
  const rows = snapshot.rows.map((row) => ({
    createdAt: row.created_at,
    id: row.id,
    candidate: byId.get(row.id)!,
  }));
  rows.push({
    createdAt: record.created_at,
    id: record.id,
    candidate: decodedCandidateRow(record),
  });
  rows.sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
  );
  return rows.map(({ candidate }) => candidate);
}

export async function approvePreparedGameDataAction(
  actorId: string,
  record: TrustedGameDataActionRecord,
  clientIp?: string | null
): Promise<void> {
  if (record.status !== 'pending') throw new TrustedGameDataMutationError('not_found');
  const snapshot = await readApprovedReplaySnapshot();
  if (record.is_public) {
    if (!snapshot.rows.some((row) => row.id === record.id)) {
      throw new TrustedGameDataMutationError('replay_epoch_conflict');
    }
  } else {
    validateCandidate(insertCandidateInSemanticOrder(snapshot, record));
  }

  const { error } = await requireSupabaseAdminClient().rpc('prepared_approve_game_data_action', {
    p_actor_id: actorId,
    p_action_id: record.id,
    p_expected_entity_type: record.entity_type,
    p_expected_entry: record.entry,
    p_expected_replay_epoch: snapshot.replayEpoch,
    ...(clientIp === undefined ? {} : { p_ip: clientIp }),
  });
  if (error) throw persistenceError(error);
  invalidatePendingGameDataActionsCache();
  invalidatePublicGameDataActionsCache();
}

export async function markPreparedGameDataActionSynced(
  actorId: string,
  record: TrustedGameDataActionRecord,
  clientIp?: string | null
): Promise<void> {
  if (record.status !== 'approved' || !record.is_public) {
    throw new TrustedGameDataMutationError('not_found');
  }
  const snapshot = await readApprovedReplaySnapshot();
  if (!snapshot.rows.some((row) => row.id === record.id)) {
    throw new TrustedGameDataMutationError('replay_epoch_conflict');
  }
  validateCandidate(candidateRows(snapshot).filter((row) => row.rowId !== record.id));

  const { error } = await requireSupabaseAdminClient().rpc(
    'prepared_mark_game_data_action_synced',
    {
      p_actor_id: actorId,
      p_action_id: record.id,
      p_expected_entity_type: record.entity_type,
      p_expected_entry: record.entry,
      p_expected_replay_epoch: snapshot.replayEpoch,
      ...(clientIp === undefined ? {} : { p_ip: clientIp }),
    }
  );
  if (error) throw persistenceError(error);
  invalidatePublicGameDataActionsCache();
}

export async function revokePreparedGameDataAction(
  actorId: string,
  record: TrustedGameDataActionRecord,
  clientIp?: string | null
): Promise<void> {
  if (!record.is_public) {
    throw new TrustedGameDataMutationError('not_found');
  }
  const snapshot = await readApprovedReplaySnapshot();
  if (!snapshot.rows.some((row) => row.id === record.id)) {
    throw new TrustedGameDataMutationError('replay_epoch_conflict');
  }
  validateCandidate(candidateRows(snapshot).filter((row) => row.rowId !== record.id));

  const { error } = await requireSupabaseAdminClient().rpc('prepared_revoke_game_data_action', {
    p_actor_id: actorId,
    p_action_id: record.id,
    p_expected_entity_type: record.entity_type,
    p_expected_entry: record.entry,
    p_expected_replay_epoch: snapshot.replayEpoch,
    ...(clientIp === undefined ? {} : { p_ip: clientIp }),
  });
  if (error) throw persistenceError(error);
  invalidatePublicGameDataActionsCache();
}
