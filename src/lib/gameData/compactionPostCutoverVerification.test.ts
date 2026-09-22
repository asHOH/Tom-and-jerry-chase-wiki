import {
  resolvePostCutoverManifestSelection,
  verifyCompactionDependencyRows,
  verifyPostCutoverRowEvidence,
  verifyStablePostCutoverProduction,
} from './compactionPostCutoverVerification';

const row = (id: string, status: string, isPublic: boolean, entry: unknown = { value: id }) => ({
  id,
  entity_type: 'items',
  entry,
  created_at: `2026-07-28T00:00:0${id}.000Z`,
  created_by: null,
  status,
  is_public: isPublic,
  message: null,
});

describe('post-cutover compaction verification', () => {
  it('recovers the normal cutover selection from bound pre-cutover evidence', () => {
    expect(
      resolvePostCutoverManifestSelection({
        rows: [{ id: '1' }, { id: '2' }],
        cutoverRowIds: ['1', '2'],
        verificationDependencyRowIds: ['3'],
        result: {
          preCutoverRetainedRows: {
            receiptKind: 'preCutoverRetainedRows',
            path: '.tmp/retained.json',
            fileDigest: `v1:${'a'.repeat(64)}`,
            rowCount: 2,
            target: { host: 'project.supabase.co' },
          },
        },
      })
    ).toEqual({
      success: true,
      value: {
        originalManifestRowIds: ['1', '2'],
        additionalSyncedRowIds: [],
        actionIds: ['1', '2'],
        verificationDependencyRowIds: ['3'],
        targetHost: 'project.supabase.co',
      },
    });
  });

  it('does not infer a recovery selection from unbound retained rows', () => {
    expect(
      resolvePostCutoverManifestSelection({
        rows: [{ id: '1' }],
        cutoverRowIds: ['1'],
        result: { preCutoverRetainedRows: { path: '.tmp/retained.json' } },
      })
    ).toEqual({
      success: false,
      failures: ['invalid_pre_cutover_retained_rows_binding'],
    });
  });

  it('preserves the original manifest rows and adds only retrospective synced rows', () => {
    expect(
      resolvePostCutoverManifestSelection({
        rows: [{ id: '1' }, { id: '2' }],
        retrospectiveObservation: {
          target: { host: 'project.supabase.co' },
          originalPlan: { plannedCutoverRowCount: 2, deferredRowCount: 1 },
          observedRemoteState: { rowCount: 3, status: 'synced', isPublic: false },
          additionalObservedSyncedRowIds: ['3'],
        },
      })
    ).toEqual({
      success: true,
      value: {
        originalManifestRowIds: ['1', '2'],
        additionalSyncedRowIds: ['3'],
        actionIds: ['1', '2', '3'],
        verificationDependencyRowIds: [],
        targetHost: 'project.supabase.co',
      },
    });
  });

  it('rejects an observation that overlaps or does not account for the exact row set', () => {
    expect(
      resolvePostCutoverManifestSelection({
        rows: [{ id: '1' }, { id: '2' }],
        retrospectiveObservation: {
          target: { host: 'project.supabase.co' },
          originalPlan: { plannedCutoverRowCount: 2, deferredRowCount: 1 },
          observedRemoteState: { rowCount: 4, status: 'synced', isPublic: false },
          additionalObservedSyncedRowIds: ['2'],
        },
      })
    ).toEqual({
      success: false,
      failures: expect.arrayContaining([
        'retrospective_row_overlap',
        'retrospective_observation_mismatch',
      ]),
    });
  });

  it('requires retained approved/public rows to match exact synced/private remote content', () => {
    expect(
      verifyPostCutoverRowEvidence(
        ['1', '2'],
        [row('1', 'approved', true), row('2', 'approved', true)],
        [row('1', 'synced', false), row('2', 'synced', false)]
      )
    ).toMatchObject({ proven: true, failures: [] });

    expect(
      verifyPostCutoverRowEvidence(
        ['1', '2'],
        [row('1', 'approved', true), row('2', 'approved', true)],
        [row('1', 'approved', true), row('2', 'synced', false, { value: 'changed' })]
      )
    ).toMatchObject({
      proven: false,
      failures: expect.arrayContaining([
        { code: 'remote_row_not_synced_private', rowId: '1' },
        { code: 'retained_row_content_mismatch', rowId: '2' },
      ]),
    });
  });

  it.each([
    { dependencies: ['1'] },
    { dependencies: ['3'] },
    { dependencies: ['4', '4'] },
    { dependencies: [''] },
  ])('rejects overlapping or invalid dependency roles: $dependencies', ({ dependencies }) => {
    expect(
      resolvePostCutoverManifestSelection({
        rows: [{ id: '1' }, { id: '2' }],
        verificationDependencyRowIds: dependencies,
        retrospectiveObservation: {
          target: { host: 'project.supabase.co' },
          originalPlan: { plannedCutoverRowCount: 2, deferredRowCount: 1 },
          observedRemoteState: { rowCount: 3, status: 'synced', isPublic: false },
          additionalObservedSyncedRowIds: ['3'],
        },
      })
    ).toMatchObject({ success: false });
  });

  it('keeps dependency rows separate from retained and archived rows', () => {
    const retained = [row('1', 'approved', true)];
    const remote = [row('1', 'synced', false), row('2', 'approved', true)];
    expect(verifyPostCutoverRowEvidence(['1'], retained, remote, ['2'])).toMatchObject({
      proven: true,
      verifiedDependencyRowIds: ['2'],
      failures: [],
    });
    expect(
      verifyPostCutoverRowEvidence(['1'], retained, [remote[0], row('2', 'synced', false)], ['2'])
    ).toMatchObject({
      proven: false,
      failures: [{ code: 'verification_dependency_not_approved_public', rowId: '2' }],
    });
    expect(verifyPostCutoverRowEvidence(['1'], retained, [remote[0]], ['2'])).toMatchObject({
      proven: false,
      failures: [{ code: 'verification_dependency_row_set_mismatch' }],
    });
  });

  it('checks exact dependency sets, visibility, and approval status', () => {
    expect(verifyCompactionDependencyRows([], [])).toMatchObject({ proven: true });
    const approved = row('1', 'approved', true);
    for (const rows of [
      [],
      [approved, approved],
      [approved, row('2', 'approved', true)],
      [row('1', 'pending', true)],
      [row('1', 'approved', false)],
      [null],
    ]) {
      expect(verifyCompactionDependencyRows(['1'], rows)).toMatchObject({
        proven: false,
        verifiedRowIds: [],
      });
    }
  });

  it('binds both production reads to one deployment identity and the current snapshot', () => {
    const expected = { replayEpoch: 70, actionRevision: 'v1:revision', rowCount: 5 };
    const proof = {
      deployedCommit: 'patched-commit',
      gameDataArtifact: { deploymentIdentity: 'deployment-1', ...expected },
    };
    expect(verifyStablePostCutoverProduction(proof, proof, expected)).toEqual({
      proven: true,
      failures: [],
    });
    expect(
      verifyStablePostCutoverProduction(
        proof,
        {
          deployedCommit: 'new-commit',
          gameDataArtifact: { deploymentIdentity: 'deployment-2', ...expected, replayEpoch: 71 },
        },
        expected
      )
    ).toEqual({
      proven: false,
      failures: [
        'after_replayEpoch_mismatch',
        'deployed_commit_changed',
        'deployment_identity_changed',
      ],
    });
  });
});
