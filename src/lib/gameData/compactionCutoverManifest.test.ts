import { prepareCompactionCutoverManifest } from './compactionCutoverManifest';
import { readCompactionReconciliation } from './compactionVerification';

const manifest = () => ({
  rows: [{ id: 'cutover-1' }, { id: 'cutover-2' }],
  cutoverRowIds: ['cutover-1', 'cutover-2'],
  verificationDependencyRowIds: ['dependency-1'],
  repository: { patchedHead: 'patched-commit' },
  fingerprint: {
    replayEpoch: 42,
    actionRevision: `v1:${'a'.repeat(64)}`,
    rowContentDigests: {
      'cutover-1': `v1:${'b'.repeat(64)}`,
      'cutover-2': `v1:${'c'.repeat(64)}`,
    },
    snapshotRowCount: 3,
  },
  result: {
    cutoverVerification: {
      patchedCommit: 'patched-commit',
      manifestUnchanged: true,
      snapshotStableDuringVerification: true,
      idempotence: { proven: true },
      actionPatch: {
        verifiedRowIds: ['cutover-1', 'cutover-2', 'dependency-1'],
        failures: [],
        dependencyReplayFailures: [],
      },
      publishedParity: { proven: true },
      production: null,
    },
  },
});

describe('compaction cutover manifest', () => {
  it('binds both verification proofs to the exact approved reconciliation', () => {
    const approvedReconciliation = {
      reason: 'Explicitly approved content correction',
      sourceChanges: [],
      publishedChanges: [{ path: ['items', 'item'], before: 'old', after: 'new' }],
    };
    const digest = readCompactionReconciliation(approvedReconciliation)!.digest;
    const original = manifest();
    const value = {
      ...original,
      approvedReconciliation,
      result: {
        cutoverVerification: {
          ...original.result.cutoverVerification,
          actionPatch: {
            ...original.result.cutoverVerification.actionPatch,
            approvedReconciliationDigest: digest,
          },
          publishedParity: {
            proven: true,
            strictlyEqual: false,
            approvedReconciliationDigest: digest,
          },
        },
      },
    };
    expect(prepareCompactionCutoverManifest(value).success).toBe(true);
    approvedReconciliation.publishedChanges[0]!.after = 'unapproved';
    expect(prepareCompactionCutoverManifest(value)).toEqual({
      success: false,
      failures: ['approved_reconciliation_not_bound'],
    });
  });
  it('accepts verified cutover rows before deployment without requiring duplicate replay', () => {
    const value = manifest();
    value.result.cutoverVerification.idempotence.proven = false;
    expect(prepareCompactionCutoverManifest(value)).toEqual({
      success: true,
      value: {
        actionIds: ['cutover-1', 'cutover-2'],
        verificationDependencyRowIds: ['dependency-1'],
        replayEpoch: 42,
        actionRevision: `v1:${'a'.repeat(64)}`,
        patchedCommit: 'patched-commit',
      },
    });
  });

  it('rejects stale or incomplete preflight evidence', () => {
    const invalid = manifest();
    invalid.repository.patchedHead = 'different-commit';
    invalid.result.cutoverVerification.snapshotStableDuringVerification = false;
    invalid.result.cutoverVerification.actionPatch.verifiedRowIds = ['cutover-1'];

    expect(prepareCompactionCutoverManifest(invalid)).toEqual({
      success: false,
      failures: expect.arrayContaining([
        'patched_commit_not_bound',
        'snapshot_not_stable',
        'action_patch_not_verified',
      ]),
    });
  });
});
