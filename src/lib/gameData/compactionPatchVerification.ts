import {
  verifyActionPatch,
  type ActionPatchRow,
  type ActionPatchTargetRegistry,
  type ActionPatchVerificationFailure,
} from './actionPatchVerification';
import { decodeStoredActionRow } from './actionRowDecoder';
import { applyCheckedActionRow } from './checkedActionReplay';

export type CompactionDependencyReplayFailure = {
  rowId: string;
  code: 'invalid_status' | 'unknown_entity_type' | 'invalid_row' | 'replay_failed';
  detail?: unknown;
};

export type CompactionActionPatchVerificationResult = {
  verifiedRowIds: string[];
  failures: ActionPatchVerificationFailure[];
  dependencyReplayFailures: CompactionDependencyReplayFailure[];
};

/**
 * Verifies cutover rows against a patched baseline while preserving later rows that
 * remain dynamic. The supplied targets are disposable and are mutated by dependency replay.
 */
export function verifyCompactionActionPatch(
  cutoverRows: readonly ActionPatchRow[],
  dependencyRows: readonly ActionPatchRow[],
  targets: ActionPatchTargetRegistry
): CompactionActionPatchVerificationResult {
  const dependencyReplayFailures: CompactionDependencyReplayFailure[] = [];

  for (const row of [...dependencyRows].sort(
    (left, right) =>
      left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id)
  )) {
    if (row.status !== 'approved' || !row.is_public) {
      dependencyReplayFailures.push({ rowId: row.id, code: 'invalid_status' });
      continue;
    }
    const target = targets[row.entity_type];
    if (!target) {
      dependencyReplayFailures.push({ rowId: row.id, code: 'unknown_entity_type' });
      continue;
    }
    const decoded = decodeStoredActionRow(row);
    if (!decoded.success) {
      dependencyReplayFailures.push({
        rowId: row.id,
        code: 'invalid_row',
        detail: decoded.error.code,
      });
      continue;
    }
    const replay = applyCheckedActionRow({
      rowId: row.id,
      actions: decoded.value.actions,
      targets: [target],
    });
    if (!replay.success) {
      dependencyReplayFailures.push({
        rowId: row.id,
        code: 'replay_failed',
        detail: replay.error,
      });
    }
  }

  if (dependencyReplayFailures.length > 0) {
    return { verifiedRowIds: [], failures: [], dependencyReplayFailures };
  }

  return {
    ...verifyActionPatch([...cutoverRows, ...dependencyRows], targets),
    dependencyReplayFailures,
  };
}
