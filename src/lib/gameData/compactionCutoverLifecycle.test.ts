import {
  recordCompactionPostCutoverVerification,
  runCompactionCutoverSync,
  type MutableCompactionCutoverManifest,
  type PreCutoverRetainedRowsBinding,
} from './compactionCutoverLifecycle';
import { prepareCompactionCutoverManifest } from './compactionCutoverManifest';
import {
  resolvePostCutoverManifestSelection,
  verifyCompactionDependencyRows,
  verifyPostCutoverRowEvidence,
} from './compactionPostCutoverVerification';

const target = { host: 'project.supabase.co', projectRef: 'project' };
const actionRevision = `v1:${'a'.repeat(64)}`;

const createManifest = () => ({
  rows: [{ id: 'cutover-1' }, { id: 'cutover-2' }],
  cutoverRowIds: ['cutover-1', 'cutover-2'],
  verificationDependencyRowIds: ['dependency-1'],
  repository: { deployedHead: 'deployed-commit' },
  fingerprint: {
    replayEpoch: 42,
    actionRevision,
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
          actionRevision,
          rowCount: 3,
        },
      },
    },
  },
});

const actionRow = (id: string, status: string, isPublic: boolean, value = id) => ({
  id,
  entity_type: 'items',
  entry: { actions: [{ op: 'set', path: ['value'], newValue: value }] },
  created_at: `2026-07-28T00:00:0${id.endsWith('1') ? '1' : '2'}.000Z`,
  created_by: null,
  status,
  is_public: isPublic,
  message: null,
});

const retainedRows = [
  actionRow('cutover-1', 'approved', true),
  actionRow('cutover-2', 'approved', true),
];

const retainedBinding: PreCutoverRetainedRowsBinding = {
  receiptKind: 'preCutoverRetainedRows',
  path: '.tmp/cohort.retained-rows-42.json',
  fileDigest: `v1:${'d'.repeat(64)}`,
  capturedAt: '2026-09-03T01:00:00.000Z',
  target,
  replayEpoch: 42,
  actionRevision,
  snapshotRowCount: 3,
  rowCount: 2,
};

const cloneManifest = (
  manifest: MutableCompactionCutoverManifest
): MutableCompactionCutoverManifest =>
  JSON.parse(JSON.stringify(manifest)) as MutableCompactionCutoverManifest;

describe('game-data compaction cutover lifecycle', () => {
  it('records normal cutovers without recovery metadata and preserves legacy post-check limits', async () => {
    const manifest = createManifest();
    const check = prepareCompactionCutoverManifest(manifest);
    expect(check).toMatchObject({ success: true });
    if (!check.success) throw new Error('fixture_not_cutover_ready');

    const events: string[] = [];
    const persisted: MutableCompactionCutoverManifest[] = [];
    let remoteRows = retainedRows.map((row) => ({ ...row }));
    const atomicRpc = jest.fn(async () => {
      events.push('atomic-rpc');
      expect(persisted.at(-1)).toMatchObject({
        result: { preCutoverRetainedRows: retainedBinding },
      });
      remoteRows = remoteRows.map((row) => ({
        ...row,
        status: 'synced',
        is_public: false,
      }));
      return {
        outcome: 'confirmed' as const,
        replayEpochAfter: 44,
        observedReplayEpoch: 44,
        syncedActionIds: ['cutover-1', 'cutover-2'],
      };
    });

    await runCompactionCutoverSync({
      manifest,
      prepared: check.value,
      target,
      capturePreCutoverRows: async () => {
        events.push('capture-retained');
        return retainedBinding;
      },
      executeCutover: atomicRpc,
      verifyDependencies: async () => {
        events.push('verify-dependencies');
        return ['dependency-1'];
      },
      persistManifest: async (nextManifest) => {
        const persistedManifest = cloneManifest(nextManifest);
        persisted.push(persistedManifest);
        events.push(
          persistedManifest.result && 'remoteCutover' in persistedManifest.result
            ? 'persist-cutover'
            : 'persist-retained'
        );
      },
      now: () => '2026-09-03T01:01:00.000Z',
    });

    expect(events).toEqual([
      'verify-dependencies',
      'capture-retained',
      'persist-retained',
      'atomic-rpc',
      'verify-dependencies',
      'persist-cutover',
    ]);
    expect(atomicRpc).toHaveBeenCalledTimes(1);
    expect(manifest).not.toHaveProperty('retrospectiveObservation');
    expect(persisted.at(-1)).not.toHaveProperty('retrospectiveObservation');

    const selection = resolvePostCutoverManifestSelection(manifest);
    expect(selection).toMatchObject({ success: true });
    if (!selection.success) throw new Error('fixture_not_post_cutover_ready');
    const rowEvidence = verifyPostCutoverRowEvidence(
      selection.value.actionIds,
      retainedRows,
      [...remoteRows, actionRow('dependency-1', 'approved', true)],
      selection.value.verificationDependencyRowIds
    );
    expect(rowEvidence).toMatchObject({ proven: true, failures: [] });

    const postCheckEvidence = {
      baselineCommit: 'baseline-commit',
      patchedCommit: 'deployed-commit',
      target,
      replayEpoch: 44,
      actionRevision: `v1:${'e'.repeat(64)}`,
      snapshotRowCount: 1,
      selection: selection.value,
      rowEvidence,
      preCutoverFingerprintCaptured: true,
      retainedRows: {
        path: retainedBinding.path,
        capturedAt: retainedBinding.capturedAt,
        replayEpochAtCapture: retainedBinding.replayEpoch,
        rowCount: retainedBinding.rowCount,
      },
      idempotence: {
        proven: true,
        actionCount: 2,
        operationCounts: { set: 2 },
        failures: [],
      },
      actionPatch: { verifiedRowIds: selection.value.actionIds, failures: [] },
      production: {
        deployedCommit: 'deployed-commit',
        gameDataArtifact: {
          deploymentIdentity: 'deployment-identity',
          replayEpoch: 44,
          actionRevision: `v1:${'e'.repeat(64)}`,
          rowCount: 1,
        },
      },
      parity: { proven: true, mismatchedDomains: [] },
    };
    recordCompactionPostCutoverVerification(
      manifest,
      postCheckEvidence,
      () => '2026-09-03T01:02:00.000Z'
    );

    expect(manifest).toMatchObject({
      result: {
        preCutoverRetainedRows: retainedBinding,
        remoteCutover: {
          executedAt: '2026-09-03T01:01:00.000Z',
          replayEpochBefore: 42,
          replayEpochAfter: 44,
          syncedActionIds: ['cutover-1', 'cutover-2'],
          verifiedDependencyRowIds: ['dependency-1'],
        },
        postCutoverVerification: {
          receiptKind: 'postCutoverVerification',
          verifiedAt: '2026-09-03T01:02:00.000Z',
          exactRows: {
            verifiedRowIds: ['cutover-1', 'cutover-2'],
            status: 'synced',
            isPublic: false,
          },
          idempotence: { proven: true },
          limitations: [
            'verification-only receipt; it does not prove who performed the earlier status transition',
            'verification-only receipt; it does not prove the earlier execution time or atomicity',
          ],
          verificationDependencies: {
            verifiedRowIds: ['dependency-1'],
            status: 'approved',
            isPublic: true,
          },
        },
      },
      workflowBoundary: {
        remoteMutation: true,
        cutover: true,
        postCutoverVerification: { status: 'passed' },
      },
    });

    const observation = {
      target,
      originalPlan: { plannedCutoverRowCount: 2, deferredRowCount: 0 },
      observedRemoteState: { rowCount: 2, status: 'synced', isPublic: false },
      additionalObservedSyncedRowIds: [],
    };
    const recoveryManifest = {
      rows: manifest.rows,
      verificationDependencyRowIds: manifest.verificationDependencyRowIds,
      retrospectiveObservation: observation,
    };
    expect(resolvePostCutoverManifestSelection(recoveryManifest)).toMatchObject({
      success: true,
      value: { actionIds: selection.value.actionIds },
    });
    recordCompactionPostCutoverVerification(recoveryManifest, {
      ...postCheckEvidence,
      preCutoverFingerprintCaptured: false,
    });
    expect(recoveryManifest.retrospectiveObservation).toEqual(observation);
    expect(recoveryManifest).toHaveProperty(
      'result.postCutoverVerification.limitations',
      expect.arrayContaining([
        'pre-cutover replay fingerprint was not captured and is not reconstructed',
      ])
    );
  });

  it.each(['snapshot_changed_before_retained_capture', 'retained_rows_write_failed'])(
    'does not invoke the atomic RPC when retained capture fails with %s',
    async (failure) => {
      const manifest = createManifest();
      const check = prepareCompactionCutoverManifest(manifest);
      if (!check.success) throw new Error('fixture_not_cutover_ready');
      const atomicRpc = jest.fn();
      const persistManifest = jest.fn();

      await expect(
        runCompactionCutoverSync({
          manifest,
          prepared: check.value,
          target,
          capturePreCutoverRows: async () => {
            throw new Error(failure);
          },
          executeCutover: atomicRpc,
          verifyDependencies: async () => ['dependency-1'],
          persistManifest,
        })
      ).rejects.toThrow(failure);
      expect(atomicRpc).not.toHaveBeenCalled();
      expect(persistManifest).not.toHaveBeenCalled();
      expect(manifest).not.toHaveProperty('result.preCutoverRetainedRows');
    }
  );

  it('does not invoke the atomic RPC when the retained binding cannot be persisted', async () => {
    const manifest = createManifest();
    const check = prepareCompactionCutoverManifest(manifest);
    if (!check.success) throw new Error('fixture_not_cutover_ready');
    const atomicRpc = jest.fn();

    await expect(
      runCompactionCutoverSync({
        manifest,
        prepared: check.value,
        target,
        capturePreCutoverRows: async () => retainedBinding,
        executeCutover: atomicRpc,
        verifyDependencies: async () => ['dependency-1'],
        persistManifest: async () => {
          throw new Error('manifest_write_failed');
        },
      })
    ).rejects.toThrow('manifest_write_failed');
    expect(atomicRpc).not.toHaveBeenCalled();
  });

  it('refuses a post-check receipt when retained evidence was tampered with', () => {
    const manifest: MutableCompactionCutoverManifest = {};
    const tamperedRows = [actionRow('cutover-1', 'approved', true, 'tampered'), retainedRows[1]];
    const remoteRows = retainedRows.map((row) => ({
      ...row,
      status: 'synced',
      is_public: false,
    }));
    const rowEvidence = verifyPostCutoverRowEvidence(
      ['cutover-1', 'cutover-2'],
      tamperedRows,
      remoteRows
    );
    expect(rowEvidence).toMatchObject({
      proven: false,
      failures: expect.arrayContaining([
        { code: 'retained_row_content_mismatch', rowId: 'cutover-1' },
      ]),
    });

    expect(() =>
      recordCompactionPostCutoverVerification(manifest, {
        baselineCommit: 'baseline-commit',
        patchedCommit: 'deployed-commit',
        target,
        replayEpoch: 44,
        actionRevision,
        snapshotRowCount: 1,
        selection: {
          actionIds: ['cutover-1', 'cutover-2'],
          originalManifestRowIds: ['cutover-1', 'cutover-2'],
          additionalSyncedRowIds: [],
        },
        rowEvidence,
        preCutoverFingerprintCaptured: false,
        retainedRows: { path: retainedBinding.path },
        idempotence: { proven: true },
        actionPatch: { failures: [] },
        production: { deployedCommit: 'deployed-commit' },
        parity: { proven: true },
      })
    ).toThrow('post_cutover_row_evidence_not_proven');
    expect(manifest).not.toHaveProperty('result.postCutoverVerification');
  });

  it.each(['before', 'after'])('stops when a dependency changes %s the RPC', async (stage) => {
    const manifest = createManifest();
    const prepared = prepareCompactionCutoverManifest(manifest);
    if (!prepared.success) throw new Error('fixture_not_cutover_ready');
    let transitioned = false;
    const executeCutover = jest.fn(async () => {
      transitioned = true;
      return {
        outcome: 'confirmed' as const,
        replayEpochAfter: 44,
        observedReplayEpoch: 44,
        syncedActionIds: ['cutover-1', 'cutover-2'],
      };
    });
    const persistManifest = jest.fn();
    await expect(
      runCompactionCutoverSync({
        manifest,
        prepared: prepared.value,
        target,
        capturePreCutoverRows: async () => retainedBinding,
        executeCutover,
        verifyDependencies: async () => {
          const changed = stage === 'before' || transitioned;
          const proof = verifyCompactionDependencyRows(
            prepared.value.verificationDependencyRowIds,
            [actionRow('dependency-1', changed ? 'synced' : 'approved', !changed)]
          );
          if (!proof.proven) throw new Error('verification_dependencies_changed');
          return proof.verifiedRowIds;
        },
        persistManifest,
      })
    ).rejects.toThrow('verification_dependencies_changed');
    expect(executeCutover).toHaveBeenCalledTimes(stage === 'before' ? 0 : 1);
    expect(persistManifest).toHaveBeenCalledTimes(stage === 'before' ? 0 : 1);
    expect(manifest.result).not.toHaveProperty('remoteCutover');
  });
});
