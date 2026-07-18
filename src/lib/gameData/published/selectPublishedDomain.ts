import 'server-only';

import {
  applyCheckedActionRow,
  collectTouchedRootKeys,
  type CheckedRowError,
} from '@/lib/gameData/checkedActionReplay';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';

import type { ApprovedActionSnapshot, ApprovedActionSnapshotRow } from './approvedActionSnapshot';
import { prepareCopyOnWriteRoot } from './copyOnWrite';
import type { PublishedGameDataByType } from './types';

export class PublishedGameDataReplayError extends Error {
  readonly detail: CheckedRowError;

  constructor(detail: CheckedRowError) {
    super(`Approved action row ${detail.rowId} failed checked replay`);
    this.name = 'PublishedGameDataReplayError';
    this.detail = detail;
  }
}

function selectReplayRows(
  entityType: PublishableEntityType,
  snapshot: ApprovedActionSnapshot
): ApprovedActionSnapshotRow[] {
  const handledIds = new Set<string>();
  const rows: ApprovedActionSnapshotRow[] = [];

  for (const row of snapshot.rows) {
    if (row.entityType !== entityType || !row.rowId || handledIds.has(row.rowId)) continue;
    handledIds.add(row.rowId);
    rows.push(row);
  }

  return rows;
}

function collectReplayRootKeys(rows: readonly ApprovedActionSnapshotRow[]): readonly string[] {
  const rootKeys = new Set<string>();

  for (const row of rows) {
    const touchedRoots = collectTouchedRootKeys(row.actions);
    if (!touchedRoots.success) {
      throw new PublishedGameDataReplayError({
        ...touchedRoots.error,
        rowId: row.rowId,
        stage: 'parse',
        actionIndex: touchedRoots.actionIndex,
      });
    }
    for (const rootKey of touchedRoots.value) rootKeys.add(rootKey);
  }

  return Object.freeze([...rootKeys]);
}

export function selectPublishedGameData<EntityType extends PublishableEntityType>(
  entityType: EntityType,
  canonicalData: PublishedGameDataByType[EntityType],
  snapshot: ApprovedActionSnapshot
): PublishedGameDataByType[EntityType] {
  const rows = selectReplayRows(entityType, snapshot);
  const touchedRootKeys = collectReplayRootKeys(rows);
  const workingRoot = prepareCopyOnWriteRoot(
    canonicalData as Readonly<Record<string, unknown>>,
    touchedRootKeys
  );

  for (const row of rows) {
    const result = applyCheckedActionRow({
      rowId: row.rowId,
      actions: row.actions,
      targets: [workingRoot],
    });
    if (!result.success) throw new PublishedGameDataReplayError(result.error);
  }

  return workingRoot as PublishedGameDataByType[EntityType];
}
