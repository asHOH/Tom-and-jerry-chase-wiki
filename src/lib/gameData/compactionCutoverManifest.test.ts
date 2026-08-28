import { prepareCompactionCutoverManifest } from './compactionCutoverManifest';

const manifest = () => ({
  rows: [{ id: 'cutover-1' }, { id: 'cutover-2' }],
  cutoverRowIds: ['cutover-1', 'cutover-2'],
  verificationDependencyRowIds: ['dependency-1'],
  repository: { deployedHead: 'deployed-commit' },
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
      manifestUnchanged: true,
      snapshotStableDuringVerification: true,
      idempotence: { proven: true },
      actionPatch: {
        verifiedRowIds: ['cutover-1', 'cutover-2', 'dependency-1'],
        failures: [],
        dependencyReplayFailures: [],
      },
      publishedParity: { proven: true },
      production: {
        deployedCommit: 'deployed-commit',
        gameDataArtifact: {
          deploymentIdentity: 'deployment-identity',
          replayEpoch: 42,
          actionRevision: `v1:${'a'.repeat(64)}`,
          rowCount: 3,
        },
      },
    },
  },
});

describe('compaction cutover manifest', () => {
  it('extracts only cutover rows from complete deployment-bound evidence', () => {
    expect(prepareCompactionCutoverManifest(manifest())).toEqual({
      success: true,
      value: {
        actionIds: ['cutover-1', 'cutover-2'],
        verificationDependencyRowIds: ['dependency-1'],
        replayEpoch: 42,
        actionRevision: `v1:${'a'.repeat(64)}`,
        deployedCommit: 'deployed-commit',
      },
    });
  });

  it('rejects stale or incomplete preflight evidence', () => {
    const invalid = manifest();
    invalid.result.cutoverVerification.idempotence.proven = false;
    invalid.result.cutoverVerification.production.gameDataArtifact.actionRevision = `v1:${'d'.repeat(64)}`;
    invalid.result.cutoverVerification.actionPatch.verifiedRowIds = ['cutover-1'];

    expect(prepareCompactionCutoverManifest(invalid)).toEqual({
      success: false,
      failures: expect.arrayContaining([
        'cutover_not_idempotent',
        'production_artifact_not_bound',
        'action_patch_not_verified',
      ]),
    });
  });
});
