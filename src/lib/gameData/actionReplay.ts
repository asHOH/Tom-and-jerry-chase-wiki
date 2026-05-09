import { applyActionEntry, type ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { normalizePublicActionEntries } from './actionEntries';
import type { PublicActionRow } from './publicActionsTypes';

export type PublicActionApplyResult = 'mutated' | 'handled' | 'skipped';

type ApplyPublicActionRowsOptions = {
  rows: PublicActionRow[];
  handledIds: Set<string>;
  resolveTargets: (entityType: string) => Record<string, unknown>[] | null;
  shouldApply?: (row: PublicActionRow) => boolean;
  applyWithin?: (row: PublicActionRow, fn: () => void) => void;
  applyEntry?: (row: PublicActionRow, entry: ActionHistoryEntry) => PublicActionApplyResult;
  onError?: (row: PublicActionRow, error: unknown) => void;
};

type ApplyPublicActionRowsResult = {
  handledCount: number;
  mutatedCount: number;
  handledIds: string[];
};

function markHandled(rowId: string, handledIds: Set<string>, newlyHandledIds: string[]): void {
  handledIds.add(rowId);
  newlyHandledIds.push(rowId);
}

function applyWithCustomHandler(
  row: PublicActionRow,
  entries: ActionHistoryEntry[],
  applyEntry: (row: PublicActionRow, entry: ActionHistoryEntry) => PublicActionApplyResult
): PublicActionApplyResult {
  let sawHandled = false;
  let sawMutated = false;

  for (const entry of entries) {
    const result = applyEntry(row, entry);
    if (result === 'skipped') return 'skipped';
    if (result === 'mutated') sawMutated = true;
    if (result === 'handled') sawHandled = true;
  }

  if (sawMutated) return 'mutated';
  return sawHandled ? 'handled' : 'skipped';
}

function applyWithResolvedTargets(
  row: PublicActionRow,
  entries: ActionHistoryEntry[],
  targets: Record<string, unknown>[],
  applyWithin?: (row: PublicActionRow, fn: () => void) => void
): PublicActionApplyResult {
  if (targets.length === 0) return 'handled';

  const apply = () => {
    for (const entry of entries) {
      for (const target of targets) {
        applyActionEntry(target, entry);
      }
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
      let result: PublicActionApplyResult;
      if (options.applyEntry) {
        result = applyWithCustomHandler(row, entries, options.applyEntry);
      } else {
        const targets = options.resolveTargets(row.entity_type);
        if (targets === null) continue;
        result = applyWithResolvedTargets(row, entries, targets, options.applyWithin);
      }

      if (result === 'skipped') continue;

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
