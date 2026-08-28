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

export type CompactionManifestSelectionFailure = {
  code:
    | 'invalid_cutover_row_ids'
    | 'cutover_row_ids_mismatch'
    | 'invalid_verification_dependency_row_ids'
    | 'duplicate_verification_dependency_id'
    | 'verification_dependency_overlaps_cutover';
  rowId?: string;
};

export type CompactionManifestSelection = {
  cutoverRowIds: string[];
  verificationDependencyRowIds: string[];
  verificationRowIds: string[];
};

export type CompactionArtifactMetadata = {
  deploymentIdentity: string;
  replayEpoch: number | null;
  actionRevision: string;
  rowCount: number;
};

export type CompactionArtifactMetadataField = keyof CompactionArtifactMetadata;

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

function isUniqueStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string' && item.length > 0) &&
    new Set(value).size === value.length
  );
}

export function resolveCompactionManifestSelection(
  manifestRows: readonly Pick<CompactionManifestRow, 'id'>[],
  selection: {
    cutoverRowIds?: unknown;
    verificationDependencyRowIds?: unknown;
  }
):
  | { success: true; value: CompactionManifestSelection }
  | { success: false; failures: CompactionManifestSelectionFailure[] } {
  const manifestRowIds = manifestRows.map((row) => row.id);
  const cutoverRowIds = selection.cutoverRowIds ?? manifestRowIds;
  const dependencyRowIds = selection.verificationDependencyRowIds ?? [];
  const failures: CompactionManifestSelectionFailure[] = [];

  if (!isUniqueStringArray(cutoverRowIds)) {
    failures.push({ code: 'invalid_cutover_row_ids' });
  } else if (
    cutoverRowIds.length !== manifestRowIds.length ||
    cutoverRowIds.some((rowId, index) => rowId !== manifestRowIds[index])
  ) {
    failures.push({ code: 'cutover_row_ids_mismatch' });
  }

  if (
    !Array.isArray(dependencyRowIds) ||
    dependencyRowIds.some((rowId) => typeof rowId !== 'string' || rowId.length === 0)
  ) {
    failures.push({ code: 'invalid_verification_dependency_row_ids' });
  } else {
    const seen = new Set<string>();
    const cutoverSet = new Set(manifestRowIds);
    for (const rowId of dependencyRowIds) {
      if (seen.has(rowId)) {
        failures.push({ code: 'duplicate_verification_dependency_id', rowId });
      }
      if (cutoverSet.has(rowId)) {
        failures.push({ code: 'verification_dependency_overlaps_cutover', rowId });
      }
      seen.add(rowId);
    }
  }

  if (failures.length > 0 || !isUniqueStringArray(cutoverRowIds)) {
    return { success: false, failures };
  }
  const verificationDependencyRowIds = dependencyRowIds as string[];
  return {
    success: true,
    value: {
      cutoverRowIds,
      verificationDependencyRowIds,
      verificationRowIds: [...cutoverRowIds, ...verificationDependencyRowIds],
    },
  };
}

export function verifyCompactionArtifactMetadata(
  value: unknown,
  expected: Omit<CompactionArtifactMetadata, 'deploymentIdentity'>
): { proven: boolean; mismatchedFields: CompactionArtifactMetadataField[] } {
  const metadata =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const mismatchedFields: CompactionArtifactMetadataField[] = [];
  if (typeof metadata.deploymentIdentity !== 'string' || metadata.deploymentIdentity.length === 0) {
    mismatchedFields.push('deploymentIdentity');
  }
  if (metadata.replayEpoch !== expected.replayEpoch) mismatchedFields.push('replayEpoch');
  if (metadata.actionRevision !== expected.actionRevision) {
    mismatchedFields.push('actionRevision');
  }
  if (metadata.rowCount !== expected.rowCount) mismatchedFields.push('rowCount');
  return { proven: mismatchedFields.length === 0, mismatchedFields };
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
