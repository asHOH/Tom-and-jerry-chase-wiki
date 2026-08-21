import {
  createApprovedActionArtifactPayload,
  parseApprovedActionArtifactPayload,
} from './approvedActionArtifact';

jest.mock('server-only', () => ({}), { virtual: true });

const row = {
  id: 'row-a',
  entity_type: 'items',
  entry: { op: 'set', path: '火箭.description', newValue: '发布值' },
  created_at: '2026-08-21T00:00:00.000Z',
  status: 'approved',
  created_by: null,
  message: null,
  reviewed_at: null,
};

describe('approved action build artifact', () => {
  it('creates a checked payload and reproduces the database snapshot', () => {
    const artifact = createApprovedActionArtifactPayload(12, 1, [row]);
    const parsed = parseApprovedActionArtifactPayload(artifact);

    expect(artifact).toMatchObject({ replayEpoch: 12, rowCount: 1 });
    expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(parsed.snapshot.actionRevision).toBe(`v1:${artifact.checksum}`);
    expect(parsed.snapshot.rows[0]).toMatchObject({ rowId: 'row-a', entityType: 'items' });
  });

  it('rejects exact-count mismatches, unordered rows, duplicates, and checksum drift', () => {
    expect(() => createApprovedActionArtifactPayload(1, 2, [row])).toThrow(
      'incomplete_approved_action_artifact'
    );
    expect(() =>
      createApprovedActionArtifactPayload(1, 2, [
        { ...row, id: 'row-b', created_at: '2026-08-22T00:00:00.000Z' },
        row,
      ])
    ).toThrow('unordered_approved_action_artifact_rows');
    expect(() => createApprovedActionArtifactPayload(1, 2, [row, row])).toThrow(
      'duplicate_approved_action_artifact_row'
    );

    const artifact = createApprovedActionArtifactPayload(1, 1, [row]);
    expect(() =>
      parseApprovedActionArtifactPayload({
        ...artifact,
        rows: [{ ...row, entry: { ...row.entry, newValue: '篡改' } }],
      })
    ).toThrow('invalid_approved_action_artifact_checksum');
  });
});
