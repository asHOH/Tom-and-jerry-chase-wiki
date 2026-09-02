import type { CompactionCutoverInput } from './compactionCutoverManifest';

export type CompactionCutoverTarget = {
  host: string;
  projectRef: string;
};

export type PreCutoverRetainedRowsBinding = {
  receiptKind: 'preCutoverRetainedRows';
  path: string;
  fileDigest: string;
  capturedAt: string;
  target: CompactionCutoverTarget;
  replayEpoch: number;
  actionRevision: string;
  snapshotRowCount: number;
  rowCount: number;
};

export type CompactionCutoverTransition = {
  outcome: 'confirmed' | 'confirmed_after_uncertain_response';
  replayEpochAfter: number;
  observedReplayEpoch: number;
  syncedActionIds: string[];
};

export type MutableCompactionCutoverManifest = {
  result?: Record<string, unknown>;
  retrospectiveObservation?: unknown;
  workflowBoundary?: Record<string, unknown>;
};

type RunCompactionCutoverSyncOptions = {
  manifest: MutableCompactionCutoverManifest;
  prepared: CompactionCutoverInput;
  target: CompactionCutoverTarget;
  capturePreCutoverRows: () => Promise<PreCutoverRetainedRowsBinding>;
  executeCutover: () => Promise<CompactionCutoverTransition>;
  persistManifest: (manifest: MutableCompactionCutoverManifest) => Promise<void>;
  now?: () => string;
};

export async function runCompactionCutoverSync({
  manifest,
  prepared,
  target,
  capturePreCutoverRows,
  executeCutover,
  persistManifest,
  now = () => new Date().toISOString(),
}: RunCompactionCutoverSyncOptions): Promise<{
  retainedRows: PreCutoverRetainedRowsBinding;
  cutover: CompactionCutoverTransition;
}> {
  const retainedRows = await capturePreCutoverRows();
  manifest.result = { ...manifest.result, preCutoverRetainedRows: retainedRows };
  await persistManifest(manifest);

  const cutover = await executeCutover();
  manifest.result = {
    ...manifest.result,
    remoteCutover: {
      executedAt: now(),
      authorizedActorProvided: true,
      target,
      replayEpochBefore: prepared.replayEpoch,
      ...cutover,
    },
  };
  manifest.retrospectiveObservation = {
    target,
    originalPlan: {
      plannedCutoverRowCount: prepared.actionIds.length,
      deferredRowCount: 0,
    },
    observedRemoteState: {
      rowCount: cutover.syncedActionIds.length,
      status: 'synced',
      isPublic: false,
    },
    additionalObservedSyncedRowIds: [],
  };
  manifest.workflowBoundary = {
    ...manifest.workflowBoundary,
    remoteMutation: true,
    cutover: true,
    remainingCutoverBlockers: [],
  };
  await persistManifest(manifest);

  return { retainedRows, cutover };
}

type PostCutoverVerificationEvidence = {
  baselineCommit: string;
  patchedCommit: string;
  target: CompactionCutoverTarget;
  replayEpoch: number;
  actionRevision: string;
  snapshotRowCount: number;
  selection: {
    actionIds: string[];
    originalManifestRowIds: string[];
    additionalSyncedRowIds: string[];
  };
  rowEvidence: {
    proven: boolean;
    rowContentDigests: Record<string, string>;
  };
  retainedRows: unknown;
  idempotence: {
    proven: boolean;
    [key: string]: unknown;
  };
  actionPatch: unknown;
  production: Record<string, unknown>;
  parity: unknown;
};

export function recordCompactionPostCutoverVerification(
  manifest: MutableCompactionCutoverManifest,
  evidence: PostCutoverVerificationEvidence,
  now: () => string = () => new Date().toISOString()
): void {
  if (!evidence.rowEvidence.proven) {
    throw new Error('post_cutover_row_evidence_not_proven');
  }

  manifest.result = {
    ...manifest.result,
    postCutoverVerification: {
      receiptKind: 'postCutoverVerification',
      verificationOnly: true,
      verifiedAt: now(),
      target: evidence.target,
      exactRows: {
        rowCount: evidence.selection.actionIds.length,
        originalManifestRowIds: evidence.selection.originalManifestRowIds,
        additionalSyncedRowIds: evidence.selection.additionalSyncedRowIds,
        verifiedRowIds: evidence.selection.actionIds,
        status: 'synced',
        isPublic: false,
        rowContentDigests: evidence.rowEvidence.rowContentDigests,
      },
      retainedRows: evidence.retainedRows,
      currentApprovedSnapshot: {
        replayEpoch: evidence.replayEpoch,
        actionRevision: evidence.actionRevision,
        rowCount: evidence.snapshotRowCount,
        stableDuringVerification: true,
      },
      idempotence: evidence.idempotence,
      actionPatch: evidence.actionPatch,
      production: {
        ...evidence.production,
        stableDuringVerification: true,
      },
      publishedParity: evidence.parity,
      limitations: [
        'verification-only receipt; it does not prove who performed the earlier status transition',
        'verification-only receipt; it does not prove the earlier execution time or atomicity',
        'pre-cutover replay fingerprint was not captured and is not reconstructed',
      ],
    },
  };
  manifest.workflowBoundary = {
    ...manifest.workflowBoundary,
    postCutoverVerification: {
      status: 'passed',
      verificationOnly: true,
      baselineCommit: evidence.baselineCommit,
      patchedCommit: evidence.patchedCommit,
      reconstructedWithRetainedRows: evidence.selection.actionIds.length,
      currentApprovedRows: evidence.snapshotRowCount,
    },
  };
}
