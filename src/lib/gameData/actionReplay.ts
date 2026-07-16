import { getVersion, snapshot } from 'valtio/vanilla';

import { applyActionEntry, type ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { flattenActionEntries, normalizePublicActionEntries } from './actionEntries';
import type { PublicActionRow } from './publicActionsTypes';

export type PublicActionTargetRegistry = Record<string, Record<string, unknown>[]>;

type PublicActionApplyResult = 'mutated' | 'handled';

type ApplyPublicActionRowsOptions = {
  rows: PublicActionRow[];
  handledIds: Set<string>;
  resolveTargets: (entityType: string) => Record<string, unknown>[] | null;
  shouldApply?: (row: PublicActionRow) => boolean;
  applyWithin?: (row: PublicActionRow, fn: () => void) => void;
  onError?: (row: PublicActionRow, error: unknown) => void;
};

type ApplyPublicActionRowsResult = {
  handledCount: number;
  mutatedCount: number;
  handledIds: string[];
};

export function resolvePublicActionTargets(
  registry: PublicActionTargetRegistry,
  entityType: string
): Record<string, unknown>[] | null {
  return registry[entityType] ?? null;
}

function markHandled(rowId: string, handledIds: Set<string>, newlyHandledIds: string[]): void {
  handledIds.add(rowId);
  newlyHandledIds.push(rowId);
}

type ReplayBranchBackup = {
  key: string;
  existed: boolean;
  value: unknown;
};

type ReplayTargetBackup = {
  target: Record<string, unknown>;
  branches: ReplayBranchBackup[];
};

function cloneReplayValue(value: unknown): unknown {
  if (value !== null && typeof value === 'object' && getVersion(value) !== undefined) {
    return structuredClone(snapshot(value));
  }

  return structuredClone(value);
}

function getTouchedRootKeys(entries: ActionHistoryEntry[]): string[] {
  const keys = new Set<string>();

  for (const action of flattenActionEntries(entries)) {
    const rootKey = action.path.split('.')[0];
    if (rootKey) keys.add(rootKey);
  }

  return Array.from(keys);
}

function captureReplayTargets(
  targets: Record<string, unknown>[],
  rootKeys: string[]
): ReplayTargetBackup[] {
  return targets.map((target) => ({
    target,
    branches: rootKeys.map((key) => {
      const existed = Object.prototype.hasOwnProperty.call(target, key);
      return {
        key,
        existed,
        value: existed ? cloneReplayValue(target[key]) : undefined,
      };
    }),
  }));
}

function restoreReplayTargets(backups: ReplayTargetBackup[]): void {
  const rollbackErrors: unknown[] = [];

  for (let targetIndex = backups.length - 1; targetIndex >= 0; targetIndex -= 1) {
    const { target, branches } = backups[targetIndex]!;
    for (let branchIndex = branches.length - 1; branchIndex >= 0; branchIndex -= 1) {
      const { key, existed, value } = branches[branchIndex]!;
      try {
        if (existed) {
          target[key] = value;
        } else {
          delete target[key];
        }
      } catch (error) {
        rollbackErrors.push(error);
      }
    }
  }

  if (rollbackErrors.length > 0) {
    throw new AggregateError(rollbackErrors, 'Failed to roll back public action row');
  }
}

function applyWithResolvedTargets(
  row: PublicActionRow,
  entries: ActionHistoryEntry[],
  targets: Record<string, unknown>[],
  applyWithin?: (row: PublicActionRow, fn: () => void) => void
): PublicActionApplyResult {
  if (targets.length === 0) return 'handled';

  const backups = captureReplayTargets(targets, getTouchedRootKeys(entries));
  const apply = () => {
    try {
      for (const entry of entries) {
        for (const target of targets) {
          applyActionEntry(target, entry);
        }
      }
    } catch (error) {
      try {
        restoreReplayTargets(backups);
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          'Public action row failed and could not be fully rolled back'
        );
      }
      throw error;
    }
  };

  if (applyWithin) {
    applyWithin(row, apply);
  } else {
    apply();
  }

  return 'mutated';
}

export function applyPublicActionRows(
  options: ApplyPublicActionRowsOptions
): ApplyPublicActionRowsResult {
  const newlyHandledIds: string[] = [];
  let mutatedCount = 0;

  for (const row of options.rows) {
    if (!row?.id || options.handledIds.has(row.id)) continue;
    if (options.shouldApply && !options.shouldApply(row)) continue;

    const entries = normalizePublicActionEntries(row.entry);
    if (entries.length === 0) continue;

    try {
      const targets = options.resolveTargets(row.entity_type);
      if (targets === null) continue;
      const result = applyWithResolvedTargets(row, entries, targets, options.applyWithin);

      markHandled(row.id, options.handledIds, newlyHandledIds);
      if (result === 'mutated') mutatedCount += 1;
    } catch (error) {
      options.onError?.(row, error);
    }
  }

  return {
    handledCount: newlyHandledIds.length,
    mutatedCount,
    handledIds: newlyHandledIds,
  };
}
