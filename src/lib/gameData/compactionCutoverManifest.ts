import {
  resolveCompactionManifestSelection,
  verifyCompactionArtifactMetadata,
} from './compactionVerification';

export type CompactionCutoverInput = {
  actionIds: string[];
  verificationDependencyRowIds: string[];
  replayEpoch: number;
  actionRevision: string;
  deployedCommit: string;
};

type CutoverManifestResult =
  { success: true; value: CompactionCutoverInput } | { success: false; failures: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactIds(value: unknown, expectedIds: readonly string[]): boolean {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return false;
  const actualIds = new Set(value);
  return actualIds.size === expectedIds.length && expectedIds.every((id) => actualIds.has(id));
}

export function prepareCompactionCutoverManifest(value: unknown): CutoverManifestResult {
  const failures: string[] = [];
  if (!isRecord(value) || !Array.isArray(value.rows)) {
    return { success: false, failures: ['invalid_manifest'] };
  }
  const manifestRows = value.rows.filter(
    (row): row is { id: string } => isRecord(row) && typeof row.id === 'string'
  );
  if (manifestRows.length !== value.rows.length) {
    return { success: false, failures: ['invalid_manifest_rows'] };
  }

  const selection = resolveCompactionManifestSelection(manifestRows, {
    cutoverRowIds: value.cutoverRowIds,
    verificationDependencyRowIds: value.verificationDependencyRowIds,
  });
  if (!selection.success) {
    return {
      success: false,
      failures: selection.failures.map((failure) => failure.code),
    };
  }

  const fingerprint = isRecord(value.fingerprint) ? value.fingerprint : {};
  if (!Number.isSafeInteger(fingerprint.replayEpoch) || Number(fingerprint.replayEpoch) < 0) {
    failures.push('invalid_replay_epoch');
  }
  if (
    typeof fingerprint.actionRevision !== 'string' ||
    !/^v1:[a-f0-9]{64}$/u.test(fingerprint.actionRevision)
  ) {
    failures.push('invalid_action_revision');
  }
  if (
    !Number.isSafeInteger(fingerprint.snapshotRowCount) ||
    Number(fingerprint.snapshotRowCount) < selection.value.verificationRowIds.length
  ) {
    failures.push('invalid_snapshot_row_count');
  }
  const rowContentDigests = isRecord(fingerprint.rowContentDigests)
    ? fingerprint.rowContentDigests
    : {};
  if (
    selection.value.cutoverRowIds.some(
      (rowId) =>
        typeof rowContentDigests[rowId] !== 'string' ||
        !/^v1:[a-f0-9]{64}$/u.test(rowContentDigests[rowId] as string)
    )
  ) {
    failures.push('missing_row_content_digest');
  }

  const result = isRecord(value.result) ? value.result : {};
  const verification = isRecord(result.cutoverVerification) ? result.cutoverVerification : {};
  if (verification.manifestUnchanged !== true) failures.push('manifest_not_verified');
  if (verification.snapshotStableDuringVerification !== true) {
    failures.push('snapshot_not_stable');
  }
  const idempotence = isRecord(verification.idempotence) ? verification.idempotence : {};
  if (idempotence.proven !== true) failures.push('cutover_not_idempotent');
  const parity = isRecord(verification.publishedParity) ? verification.publishedParity : {};
  if (parity.proven !== true) failures.push('published_parity_not_proven');

  const actionPatch = isRecord(verification.actionPatch) ? verification.actionPatch : {};
  if (
    !hasExactIds(actionPatch.verifiedRowIds, selection.value.verificationRowIds) ||
    !Array.isArray(actionPatch.failures) ||
    actionPatch.failures.length > 0 ||
    !Array.isArray(actionPatch.dependencyReplayFailures) ||
    actionPatch.dependencyReplayFailures.length > 0
  ) {
    failures.push('action_patch_not_verified');
  }

  const production = isRecord(verification.production) ? verification.production : {};
  const artifactProof = verifyCompactionArtifactMetadata(production.gameDataArtifact, {
    replayEpoch: fingerprint.replayEpoch as number,
    actionRevision: fingerprint.actionRevision as string,
    rowCount: fingerprint.snapshotRowCount as number,
  });
  if (!artifactProof.proven) failures.push('production_artifact_not_bound');

  const repository = isRecord(value.repository) ? value.repository : {};
  if (
    typeof repository.deployedHead !== 'string' ||
    repository.deployedHead.length === 0 ||
    production.deployedCommit !== repository.deployedHead
  ) {
    failures.push('deployed_commit_not_bound');
  }

  if (failures.length > 0) return { success: false, failures };
  return {
    success: true,
    value: {
      actionIds: selection.value.cutoverRowIds,
      verificationDependencyRowIds: selection.value.verificationDependencyRowIds,
      replayEpoch: fingerprint.replayEpoch as number,
      actionRevision: fingerprint.actionRevision as string,
      deployedCommit: repository.deployedHead as string,
    },
  };
}
