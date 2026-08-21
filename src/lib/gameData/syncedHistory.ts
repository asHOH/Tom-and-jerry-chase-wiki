import 'server-only';

import { createHash } from 'node:crypto';

import { parseActionPath } from '@/lib/gameData/actionPath';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';

const HISTORY_ENTITY_TYPES = new Set([
  'characters',
  'cards',
  'specialSkills',
  'items',
  'entities',
  'buffs',
  'maps',
  'fixtures',
  'modes',
  'achievements',
]);
const OPERATIONS = new Set(['set', 'add', 'delete']);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export type SyncedHistoryAction = {
  op: 'set' | 'add' | 'delete';
  path: string;
};

export type SyncedHistorySourceRow = {
  entityType: string;
  createdAt: string;
  actions: SyncedHistoryAction[];
};

export type SyncedHistorySourcePayload = {
  sourceActionCount: number;
  rowCount: number;
  operationCount: number;
  rows: SyncedHistorySourceRow[];
};

export type SyncedHistoryArtifactPayload = SyncedHistorySourcePayload & {
  checksum: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function parseAction(value: unknown): SyncedHistoryAction {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['op', 'path']) ||
    typeof value.op !== 'string' ||
    !OPERATIONS.has(value.op) ||
    typeof value.path !== 'string'
  ) {
    throw new Error('invalid_synced_history_action');
  }
  const parsedPath = parseActionPath(value.path);
  if (!parsedPath.success) throw new Error('invalid_synced_history_action');
  return { op: value.op as SyncedHistoryAction['op'], path: parsedPath.value.path };
}

function parseRow(value: unknown): SyncedHistorySourceRow {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['actions', 'createdAt', 'entityType']) ||
    typeof value.entityType !== 'string' ||
    !HISTORY_ENTITY_TYPES.has(value.entityType) ||
    typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    !Array.isArray(value.actions) ||
    value.actions.length === 0
  ) {
    throw new Error('invalid_synced_history_row');
  }
  return {
    entityType: value.entityType,
    createdAt: value.createdAt,
    actions: value.actions.map(parseAction),
  };
}

function parsePayload(value: unknown, withChecksum: boolean): SyncedHistoryArtifactPayload {
  const keys = withChecksum
    ? ['checksum', 'operationCount', 'rowCount', 'rows', 'sourceActionCount']
    : ['operationCount', 'rowCount', 'rows', 'sourceActionCount'];
  if (
    !isRecord(value) ||
    !hasExactKeys(value, keys) ||
    !isNonNegativeInteger(value.sourceActionCount) ||
    !isNonNegativeInteger(value.rowCount) ||
    !isNonNegativeInteger(value.operationCount) ||
    !Array.isArray(value.rows)
  ) {
    throw new Error('invalid_synced_history_source');
  }

  const rows = value.rows.map(parseRow);
  const operationCount = rows.reduce((total, row) => total + row.actions.length, 0);
  if (
    value.sourceActionCount !== rows.length ||
    value.rowCount !== rows.length ||
    value.operationCount !== operationCount
  ) {
    throw new Error('incomplete_synced_history_source');
  }
  for (let index = 1; index < rows.length; index += 1) {
    if (Date.parse(rows[index - 1]!.createdAt) > Date.parse(rows[index]!.createdAt)) {
      throw new Error('unordered_synced_history_source');
    }
  }

  const checksum = createHash('sha256').update(JSON.stringify(rows), 'utf8').digest('hex');
  if (
    withChecksum &&
    (typeof value.checksum !== 'string' ||
      !SHA256_PATTERN.test(value.checksum) ||
      value.checksum !== checksum)
  ) {
    throw new Error('invalid_synced_history_checksum');
  }

  return {
    sourceActionCount: value.sourceActionCount,
    rowCount: value.rowCount,
    operationCount: value.operationCount,
    rows,
    checksum,
  };
}

export function parseSyncedHistorySourcePayload(value: unknown): SyncedHistorySourcePayload {
  const parsed = parsePayload(value, false);
  const { checksum: _checksum, ...source } = parsed;
  return source;
}

export function createSyncedHistoryArtifactPayload(
  source: SyncedHistorySourcePayload
): SyncedHistoryArtifactPayload {
  return parsePayload(source, false);
}

export function parseSyncedHistoryArtifactPayload(value: unknown): SyncedHistoryArtifactPayload {
  return parsePayload(value, true);
}

/** Adapts the minimal projection to the existing history selector interface. */
export function syncedHistoryArtifactToPublicRows(
  artifact: SyncedHistoryArtifactPayload
): PublicActionRow[] {
  return artifact.rows.map((row, index) => ({
    id: `build-synced-history-${index}`,
    entity_type: row.entityType,
    entry: row.actions,
    created_at: row.createdAt,
    status: 'synced',
    message: null,
    reviewed_at: null,
    created_by: null,
  }));
}
