import 'server-only';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { Action } from '@/lib/edit/diffUtils';
import type { DecodedStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import { cloneGameDataValue } from '@/lib/gameData/cloneGameDataValue';

export type ApprovedActionSnapshotRowInput = {
  entityType: string;
  decodedRow: DecodedStoredActionRow;
};

export type ApprovedActionSnapshotRow = DeepReadonly<{
  rowId: string;
  entityType: string;
  rawEntry: unknown;
  actions: readonly Readonly<Action>[];
}>;

export type ApprovedActionSnapshot = DeepReadonly<{
  rows: readonly ApprovedActionSnapshotRow[];
}>;

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
    rawEntry: values.rawEntry,
    actions: values.actions,
  });
}

export function createApprovedActionSnapshot(
  rows: readonly ApprovedActionSnapshotRowInput[]
): ApprovedActionSnapshot {
  return Object.freeze({ rows: Object.freeze(rows.map(copyDecodedRow)) });
}
