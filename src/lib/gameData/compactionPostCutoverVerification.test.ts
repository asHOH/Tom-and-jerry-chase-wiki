import {
  resolvePostCutoverManifestSelection,
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
