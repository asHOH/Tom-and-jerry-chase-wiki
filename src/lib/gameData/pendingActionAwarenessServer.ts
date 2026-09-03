import 'server-only';

import { createHash } from 'node:crypto';

import {
  areActionDependencyDescriptorsOrderDependent,
  toActionDependencyDescriptor,
  type ActionDependencyDescriptor,
} from '@/lib/gameData/actionDependencies';
import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import {
  PENDING_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
  PENDING_GAME_DATA_ACTIONS_CACHE_TAG,
} from '@/lib/gameData/publicActionsCache';
import type { PreparedPublishRequest } from '@/lib/gameData/publishPreparation';
import { getGameDataActionEntityKey } from '@/lib/gameData/scopedEntityPaths';
import { cached } from '@/lib/serverCache';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import type { Json } from '@/data/database.types';

import { summarizePendingActionTargets } from './pendingActionAwareness';
import type {
  PendingActionOverlapResponse,
  PendingActionTarget,
  PendingActionTargetsResponse,
} from './pendingActionAwarenessTypes';

const QUERY_PAGE_SIZE = 500;
const TARGET_LIMIT = 512;

type PendingRow = {
  id: string;
  entity_type: string;
  entry: Json;
  created_at: string;
  created_by: string | null;
  is_public: boolean;
  publish_operation_id: string | null;
};

type InternalPendingTarget = ActionDependencyDescriptor & {
  rowId: string;
  rowStateHash: string;
  entityType: string;
  entityKey: string;
  createdAt: string;
  ownership: 'self' | 'other';
  isPublic: boolean;
};

type PendingTargetSnapshot = {
  targets: InternalPendingTarget[];
  truncated: boolean;
};

const pendingRowAcquisitions = new Map<string, Promise<PendingRow[]>>();

function hashPendingRowState(row: PendingRow): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        row.id,
        row.entity_type,
        row.entry,
        row.created_at,
        row.created_by,
        row.is_public,
      ]),
      'utf8'
    )
    .digest('hex');
}

function aggregateTargets(
  targets: readonly InternalPendingTarget[],
  limit = TARGET_LIMIT
): PendingActionTargetsResponse {
  const grouped = new Map<string, PendingActionTarget & { rowIds: Set<string> }>();

  for (const target of targets) {
    const key = JSON.stringify([
      target.path,
      target.op,
      target.hasNewValue,
      target.ownership,
      target.isPublic,
    ]);
    const current = grouped.get(key);
    if (current) {
      current.rowIds.add(target.rowId);
      current.count = current.rowIds.size;
      continue;
    }
    grouped.set(key, {
      path: target.path,
      op: target.op,
      hasNewValue: target.hasNewValue,
      ownership: target.ownership,
      isPublic: target.isPublic,
      count: 1,
      rowIds: new Set([target.rowId]),
    });
  }

  const aggregated = [...grouped.values()]
    .sort((left, right) => left.path.localeCompare(right.path) || left.op.localeCompare(right.op))
    .slice(0, limit)
    .map(({ rowIds: _rowIds, ...target }) => target);

  return {
    targets: aggregated,
    truncated: grouped.size > limit,
  };
}

async function queryPendingRows(entityTypes: readonly string[]): Promise<PendingRow[]> {
  const rows: PendingRow[] = [];

  for (let from = 0; ; from += QUERY_PAGE_SIZE) {
    const { data: rawData, error } = await requireSupabaseAdminClient()
      .from('game_data_actions')
      .select(
        'id, entity_type, entry, created_at, created_by, is_public, publish_operation_id' as never
      )
      .eq('status', 'pending')
      .in('entity_type', [...entityTypes])
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + QUERY_PAGE_SIZE - 1);

    if (error) throw error;
    const data = rawData as unknown as PendingRow[] | null;
    rows.push(...(data ?? []));
    if (!data || data.length < QUERY_PAGE_SIZE) break;
  }

  return rows;
}

async function readPendingRows(entityTypes: readonly string[]): Promise<PendingRow[]> {
  const normalizedEntityTypes = [...new Set(entityTypes)].sort();
  const acquisitionKey = normalizedEntityTypes.join('\u0000');
  const activeAcquisition = pendingRowAcquisitions.get(acquisitionKey);
  if (activeAcquisition) return activeAcquisition;

  const acquisition = cached(
    ['pending-game-data-rows-v1', ...normalizedEntityTypes],
    () => queryPendingRows(normalizedEntityTypes),
    {
      revalidate: PENDING_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
      tags: [PENDING_GAME_DATA_ACTIONS_CACHE_TAG],
    }
  );
  pendingRowAcquisitions.set(acquisitionKey, acquisition);
  const clearAcquisition = () => {
    if (pendingRowAcquisitions.get(acquisitionKey) === acquisition) {
      pendingRowAcquisitions.delete(acquisitionKey);
    }
  };
  void acquisition.then(clearAcquisition, clearAcquisition);
  return acquisition;
}

async function loadPendingTargetSnapshot(options: {
  entityTypes: readonly string[];
  entityKey?: string;
  userId: string | null;
  operationId?: string;
  maxTargets?: number;
}): Promise<PendingTargetSnapshot> {
  const rows = await readPendingRows(options.entityTypes);
  const targets: InternalPendingTarget[] = [];
  let truncated = false;

  for (const row of rows) {
    if (options.operationId !== undefined && row.publish_operation_id === options.operationId) {
      continue;
    }
    let decoded: ReturnType<typeof decodeStoredActionRow>;
    try {
      decoded = decodeStoredActionRow(row);
    } catch (error) {
      console.warn('pending_game_data_action_decode_threw', { actionId: row.id, error });
      continue;
    }
    if (!decoded.success) {
      console.warn('pending_game_data_action_decode_failed', {
        actionId: row.id,
        code: decoded.error.code,
      });
      continue;
    }
    const rowStateHash = hashPendingRowState(row);

    for (const action of decoded.value.actions) {
      const entityKey = getGameDataActionEntityKey(row.entity_type, action.path);
      if (!entityKey || (options.entityKey !== undefined && entityKey !== options.entityKey)) {
        continue;
      }
      if (options.maxTargets !== undefined && targets.length >= options.maxTargets) {
        truncated = true;
        continue;
      }
      targets.push({
        ...toActionDependencyDescriptor(action),
        rowId: row.id,
        rowStateHash,
        entityType: row.entity_type,
        entityKey,
        createdAt: row.created_at,
        ownership: options.userId !== null && row.created_by === options.userId ? 'self' : 'other',
        isPublic: row.is_public,
      });
    }
  }

  return { targets, truncated };
}

export async function getPendingActionTargets(options: {
  entityType: string;
  entityKey?: string;
  userId: string | null;
}): Promise<PendingActionTargetsResponse> {
  const snapshot = await loadPendingTargetSnapshot({
    entityTypes: [options.entityType],
    ...(options.entityKey === undefined ? {} : { entityKey: options.entityKey }),
    userId: options.userId,
    maxTargets: TARGET_LIMIT,
  });
  const response = aggregateTargets(snapshot.targets);
  return { ...response, truncated: response.truncated || snapshot.truncated };
}

function preparedActionDescriptors(
  prepared: PreparedPublishRequest
): Array<ActionDependencyDescriptor & { entityType: string }> {
  return prepared.actions.flatMap((item) =>
    item.rows.flatMap((row) =>
      row.actions.map((action) => ({
        entityType: item.entityType,
        ...toActionDependencyDescriptor(action),
      }))
    )
  );
}

function targetOverlapsActions(
  target: InternalPendingTarget,
  actions: readonly (ActionDependencyDescriptor & { entityType: string })[]
): boolean {
  return actions.some(
    (action) =>
      action.entityType === target.entityType &&
      areActionDependencyDescriptorsOrderDependent(target, action)
  );
}

function acknowledgementToken(
  actions: readonly (ActionDependencyDescriptor & { entityType: string })[],
  targets: readonly InternalPendingTarget[]
): `v1:${string}` {
  const actionState = actions
    .map((action) => [action.entityType, action.op, action.path, action.hasNewValue])
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const pendingState = targets
    .map((target) => [
      target.rowId,
      target.rowStateHash,
      target.entityType,
      target.createdAt,
      target.op,
      target.path,
      target.hasNewValue,
      target.isPublic,
    ])
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const digest = createHash('sha256')
    .update(JSON.stringify(['v1', actionState, pendingState]), 'utf8')
    .digest('hex');
  return `v1:${digest}`;
}

export async function checkPendingActionAcknowledgement(options: {
  prepared: PreparedPublishRequest;
  userId: string | null;
  providedToken?: string;
  operationId?: string;
}): Promise<PendingActionOverlapResponse | null> {
  const actions = preparedActionDescriptors(options.prepared);
  if (actions.length === 0) return null;
  const entityTypes = [...new Set(actions.map((action) => action.entityType))];
  const snapshot = await loadPendingTargetSnapshot({
    entityTypes,
    userId: options.userId,
    ...(options.operationId === undefined ? {} : { operationId: options.operationId }),
  });
  const overlappingTargets = snapshot.targets.filter((target) =>
    targetOverlapsActions(target, actions)
  );
  if (overlappingTargets.length === 0) return null;

  const token = acknowledgementToken(actions, overlappingTargets);
  if (options.providedToken === token) return null;

  const aggregated = aggregateTargets(overlappingTargets);
  return {
    error: 'pending_action_overlap',
    pendingAcknowledgementToken: token,
    ...summarizePendingActionTargets(
      aggregated.targets,
      aggregated.truncated || snapshot.truncated
    ),
  };
}
