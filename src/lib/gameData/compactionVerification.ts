import { createHash } from 'node:crypto';

import type { Action } from '@/lib/edit/diffUtils';

type CanonicalValue =
  | ['undefined' | 'null']
  | ['boolean', boolean]
  | ['number', number | '-0']
  | ['string', string]
  | ['array', CanonicalValue[]]
  | ['object', Array<[string, CanonicalValue]>];

export type CompactionManifestRow = {
  id: string;
  createdAt: string;
  entityType: string;
  status: string;
  isPublic: boolean;
  actionCount: number;
  contentDigest?: string;
};

export type CompactionSnapshotRow = {
  rowId: string;
  createdAt: string;
  entityType: string;
  status: string;
  actions: readonly Readonly<Action>[];
};

export type CompactionManifestFailure = {
  code:
    | 'duplicate_manifest_id'
    | 'manifest_order_mismatch'
    | 'manifest_row_mismatch'
    | 'missing_content_digest'
    | 'content_digest_mismatch';
  rowId?: string;
  field?: string;
};

export type CompactionIdempotenceFailure = {
  rowId: string;
  actionIndex: number;
  code: 'non_set_operation' | 'missing_set_value';
};

export type CompactionValueDifference = {
  path: string;
  code: 'type_mismatch' | 'value_mismatch' | 'missing_before' | 'missing_after';
};

function canonicalizeValue(value: unknown, ancestors: Set<object>): CanonicalValue {
  if (value === undefined) return ['undefined'];
  if (value === null) return ['null'];
  if (typeof value === 'boolean') return ['boolean', value];
  if (typeof value === 'string') return ['string', value];
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError('Compaction values must contain finite numbers');
    return ['number', Object.is(value, -0) ? '-0' : value];
  }
  if (typeof value !== 'object') {
    throw new TypeError(`Unsupported compaction value type: ${typeof value}`);
  }
  if (ancestors.has(value)) throw new TypeError('Compaction values must not contain cycles');

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return ['array', value.map((item) => canonicalizeValue(item, ancestors))];
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Compaction values must contain only plain objects and arrays');
    }
    return [
      'object',
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalizeValue((value as Record<string, unknown>)[key], ancestors)]),
    ];
  } finally {
    ancestors.delete(value);
  }
}

export function encodeCanonicalCompactionValue(value: unknown): string {
  return JSON.stringify(['game-data-compaction-value', 'v1', canonicalizeValue(value, new Set())]);
}

export function createCanonicalCompactionDigest(value: unknown): {
  digest: `v1:${string}`;
  encodedBytes: number;
} {
  const encoded = encodeCanonicalCompactionValue(value);
  return {
    digest: `v1:${createHash('sha256').update(encoded, 'utf8').digest('hex')}`,
    encodedBytes: Buffer.byteLength(encoded),
  };
}

function valueKind(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function appendDifference(
  differences: CompactionValueDifference[],
  limit: number,
  difference: CompactionValueDifference
): void {
  if (differences.length < limit) differences.push(difference);
}

function collectValueDifferences(
  before: unknown,
  after: unknown,
  path: string,
  differences: CompactionValueDifference[],
  limit: number
): void {
  if (differences.length >= limit || Object.is(before, after)) return;
  if (valueKind(before) !== valueKind(after)) {
    appendDifference(differences, limit, { path, code: 'type_mismatch' });
    return;
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length && differences.length < limit; index += 1) {
      const childPath = `${path}[${index}]`;
      if (index >= before.length) {
        appendDifference(differences, limit, { path: childPath, code: 'missing_before' });
      } else if (index >= after.length) {
        appendDifference(differences, limit, { path: childPath, code: 'missing_after' });
      } else {
        collectValueDifferences(before[index], after[index], childPath, differences, limit);
      }
    }
    return;
  }
  if (
    before !== null &&
    after !== null &&
    typeof before === 'object' &&
    typeof after === 'object'
  ) {
    const beforeRecord = before as Record<string, unknown>;
    const afterRecord = after as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])].sort();
    for (const key of keys) {
      if (differences.length >= limit) break;
      const childPath = `${path}.${key}`;
      if (!Object.prototype.hasOwnProperty.call(beforeRecord, key)) {
        appendDifference(differences, limit, { path: childPath, code: 'missing_before' });
      } else if (!Object.prototype.hasOwnProperty.call(afterRecord, key)) {
        appendDifference(differences, limit, { path: childPath, code: 'missing_after' });
      } else {
        collectValueDifferences(beforeRecord[key], afterRecord[key], childPath, differences, limit);
      }
    }
    return;
  }
  appendDifference(differences, limit, { path, code: 'value_mismatch' });
}

export function findCompactionValueDifferences(
  before: unknown,
  after: unknown,
  limit = 25
): CompactionValueDifference[] {
  if (!Number.isInteger(limit) || limit < 1)
    throw new RangeError('Difference limit must be positive');
  const differences: CompactionValueDifference[] = [];
  collectValueDifferences(before, after, '$', differences, limit);
  return differences;
}

export function verifyCompactionManifestRows(
  manifestRows: readonly CompactionManifestRow[],
  snapshotRows: readonly CompactionSnapshotRow[],
  contentDigests: Readonly<Record<string, string>>
): { unchanged: boolean; failures: CompactionManifestFailure[] } {
  const failures: CompactionManifestFailure[] = [];
  const manifestIds = manifestRows.map((row) => row.id);
  if (new Set(manifestIds).size !== manifestIds.length) {
    failures.push({ code: 'duplicate_manifest_id' });
  }

  const manifestIdSet = new Set(manifestIds);
  const selectedSnapshotRows = snapshotRows.filter((row) => manifestIdSet.has(row.rowId));
  if (
    selectedSnapshotRows.length !== manifestRows.length ||
    selectedSnapshotRows.some((row, index) => row.rowId !== manifestRows[index]?.id)
  ) {
    failures.push({ code: 'manifest_order_mismatch' });
  }

  const snapshotById = new Map(snapshotRows.map((row) => [row.rowId, row]));
  for (const manifestRow of manifestRows) {
    const snapshotRow = snapshotById.get(manifestRow.id);
    if (!snapshotRow) continue;

    const fields = [
      ['createdAt', manifestRow.createdAt, snapshotRow.createdAt],
      ['entityType', manifestRow.entityType, snapshotRow.entityType],
      ['status', manifestRow.status, snapshotRow.status],
      ['isPublic', manifestRow.isPublic, true],
      ['actionCount', manifestRow.actionCount, snapshotRow.actions.length],
    ] as const;
    for (const [field, expected, actual] of fields) {
      if (expected !== actual) {
        failures.push({ code: 'manifest_row_mismatch', rowId: manifestRow.id, field });
      }
    }

    const currentDigest = contentDigests[manifestRow.id];
    if (!currentDigest) {
      failures.push({ code: 'missing_content_digest', rowId: manifestRow.id });
    } else if (manifestRow.contentDigest && manifestRow.contentDigest !== currentDigest) {
      failures.push({ code: 'content_digest_mismatch', rowId: manifestRow.id });
    }
  }

  return { unchanged: failures.length === 0, failures };
}

export function verifySetActionIdempotence(
  rows: readonly Pick<CompactionSnapshotRow, 'rowId' | 'actions'>[]
): {
  proven: boolean;
  actionCount: number;
  operationCounts: Record<string, number>;
  failures: CompactionIdempotenceFailure[];
} {
  const failures: CompactionIdempotenceFailure[] = [];
  const operationCounts: Record<string, number> = {};
  let actionCount = 0;

  for (const row of rows) {
    row.actions.forEach((action, actionIndex) => {
      actionCount += 1;
      operationCounts[action.op] = (operationCounts[action.op] ?? 0) + 1;
      if (action.op !== 'set') {
        failures.push({ rowId: row.rowId, actionIndex, code: 'non_set_operation' });
      } else if (action.newValue === undefined) {
        failures.push({ rowId: row.rowId, actionIndex, code: 'missing_set_value' });
      }
    });
  }

  return { proven: failures.length === 0, actionCount, operationCounts, failures };
}
