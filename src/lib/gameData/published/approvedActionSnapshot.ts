import 'server-only';

import { createHash } from 'node:crypto';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { Action } from '@/lib/edit/diffUtils';
import {
  decodeStoredActionRow,
  type DecodedStoredActionRow,
} from '@/lib/gameData/actionRowDecoder';
import { cloneGameDataValue } from '@/lib/gameData/cloneGameDataValue';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { isPublishableEntityType } from '@/lib/gameData/publishableEntityTypes';

export type ApprovedActionSnapshotRowInput = {
  entityType: string;
  createdAt?: string;
  status?: string;
  createdBy?: string | null;
  message?: string | null;
  reviewedAt?: string | null;
  decodedRow: DecodedStoredActionRow;
};

export type ApprovedActionSnapshotRow = DeepReadonly<{
  rowId: string;
  entityType: string;
  createdAt: string;
  status: string;
  createdBy: string | null;
  message: string | null;
  reviewedAt: string | null;
  rawEntry: unknown;
  actions: readonly Readonly<Action>[];
}>;

export type ApprovedActionSnapshot = DeepReadonly<{
  actionRevision: `v1:${string}`;
  rows: readonly ApprovedActionSnapshotRow[];
}>;

export class ApprovedActionSnapshotError extends Error {
  constructor(
    message: string,
    public readonly rowId: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ApprovedActionSnapshotError';
  }
}

function freezeDeep<T>(value: T, seen = new WeakSet<object>()): DeepReadonly<T> {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return value as DeepReadonly<T>;
  }

  seen.add(value);
  for (const child of Object.values(value)) freezeDeep(child, seen);
  return Object.freeze(value) as DeepReadonly<T>;
}

function copyDecodedRow(input: ApprovedActionSnapshotRowInput): ApprovedActionSnapshotRow {
  const copied = cloneGameDataValue({
    rawEntry: input.decodedRow.rawEntry,
    actions: input.decodedRow.actions,
  });
  if (!copied.success) {
    throw new TypeError(`Decoded action row ${input.decodedRow.rowId} is not cloneable`);
  }

  const values = copied.value as {
    rawEntry: unknown;
    actions: readonly Readonly<Action>[];
  };

  return freezeDeep({
    rowId: input.decodedRow.rowId,
    entityType: input.entityType,
    createdAt: input.createdAt ?? '',
    status: input.status ?? 'approved',
    createdBy: input.createdBy ?? null,
    message: input.message ?? null,
    reviewedAt: input.reviewedAt ?? null,
    rawEntry: values.rawEntry,
    actions: values.actions,
  });
}

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value === null || typeof value !== 'object') return value;

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const child = (value as Record<string, unknown>)[key];
    if (child !== undefined) result[key] = canonicalizeJson(child);
  }
  return result;
}

export function encodeApprovedActionRevisionRows(
  rows: readonly ApprovedActionSnapshotRow[]
): string {
  return JSON.stringify([
    'v1',
    rows.map((row) => [
      row.rowId,
      row.createdAt,
      row.entityType,
      canonicalizeJson(row.actions),
      row.status,
      row.createdBy,
      row.message,
      row.reviewedAt,
    ]),
  ]);
}

export function createApprovedActionRevision(
  rows: readonly ApprovedActionSnapshotRow[]
): `v1:${string}` {
  const digest = createHash('sha256')
    .update(encodeApprovedActionRevisionRows(rows), 'utf8')
    .digest('hex');
  return `v1:${digest}`;
}

export function createApprovedActionSnapshot(
  rows: readonly ApprovedActionSnapshotRowInput[]
): ApprovedActionSnapshot {
  const copiedRows = Object.freeze(rows.map(copyDecodedRow));
  return Object.freeze({
    actionRevision: createApprovedActionRevision(copiedRows),
    rows: copiedRows,
  });
}

export function createApprovedActionSnapshotFromRows(
  rows: readonly PublicActionRow[]
): ApprovedActionSnapshot {
  const inputs: ApprovedActionSnapshotRowInput[] = [];

  for (const row of rows) {
    if (!isPublishableEntityType(row.entity_type)) {
      throw new ApprovedActionSnapshotError(
        `Public replay row ${row.id} has unknown entity type ${row.entity_type}`,
        row.id
      );
    }

    const decoded = decodeStoredActionRow(row);
    if (!decoded.success) {
      throw new ApprovedActionSnapshotError(
        `Public replay row ${row.id} failed stored decoding`,
        row.id,
        decoded.error
      );
    }

    inputs.push({
      entityType: row.entity_type,
      createdAt: row.created_at,
      status: row.status,
      createdBy: row.created_by ?? null,
      message: row.message ?? null,
      reviewedAt: row.reviewed_at ?? null,
      decodedRow: decoded.value,
    });
  }

  return createApprovedActionSnapshot(inputs);
}
