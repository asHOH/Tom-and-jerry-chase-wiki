import { createApprovedActionSnapshotFromRows } from './published/approvedActionSnapshot';
import { selectPublishedWikiHistory } from './published/historySelectors';
import {
  createSyncedHistoryArtifactPayload,
  parseSyncedHistoryArtifactPayload,
  parseSyncedHistorySourcePayload,
  syncedHistoryArtifactToPublicRows,
} from './syncedHistory';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => ({
  unstable_cache: (callback: unknown) => callback,
}));
jest.mock('./published/buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'history-test-build',
}));

const source = {
  sourceActionCount: 1,
  rowCount: 1,
  operationCount: 2,
  rows: [
    {
      entityType: 'items',
      createdAt: '2026-08-21T00:00:00.000Z',
      actions: [
        { op: 'set', path: '火箭.description' },
        { op: 'add', path: '火箭.aliases.0' },
      ],
    },
  ],
};

describe('minimal synced-history payload', () => {
  it('validates, checksums, and adapts only the rendering projection', () => {
    const parsedSource = parseSyncedHistorySourcePayload(source);
    const artifact = createSyncedHistoryArtifactPayload(parsedSource);

    expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(parseSyncedHistoryArtifactPayload(artifact)).toEqual(artifact);
    expect(syncedHistoryArtifactToPublicRows(artifact)[0]).toMatchObject({
      status: 'synced',
      entry: source.rows[0]!.actions,
      created_by: null,
      message: null,
    });
    expect(JSON.stringify(artifact)).not.toMatch(/newValue|oldValue|createdBy|message|actionId/);
  });

  it('rejects incomplete, over-wide, unsafe, unordered, and checksum-invalid payloads', () => {
    expect(() => parseSyncedHistorySourcePayload({ ...source, sourceActionCount: 2 })).toThrow(
      'incomplete_synced_history_source'
    );
    expect(() =>
      parseSyncedHistorySourcePayload({ ...source, rows: [{ ...source.rows[0], actionId: 'x' }] })
    ).toThrow('invalid_synced_history_row');
    expect(() =>
      parseSyncedHistorySourcePayload({
        ...source,
        rows: [
          {
            ...source.rows[0],
            actions: [{ op: 'set', path: '__proto__.polluted' }],
          },
        ],
        operationCount: 1,
      })
    ).toThrow('invalid_synced_history_action');

    const twoRows = {
      ...source,
      sourceActionCount: 2,
      rowCount: 2,
      operationCount: 4,
      rows: [{ ...source.rows[0], createdAt: '2026-08-22T00:00:00.000Z' }, source.rows[0]],
    };
    expect(() => parseSyncedHistorySourcePayload(twoRows)).toThrow(
      'unordered_synced_history_source'
    );

    const artifact = createSyncedHistoryArtifactPayload(parseSyncedHistorySourcePayload(source));
    expect(() =>
      parseSyncedHistoryArtifactPayload({ ...artifact, checksum: '0'.repeat(64) })
    ).toThrow('invalid_synced_history_checksum');
  });

  it('produces the same published history as a full synced action row', () => {
    const snapshot = createApprovedActionSnapshotFromRows([]);
    const fullRows = [
      {
        id: 'synced-row',
        entity_type: 'items',
        entry: [
          {
            op: 'set',
            path: '火箭.description',
            oldValue: '旧值',
            newValue: '新值',
          },
          { op: 'add', path: '火箭.aliases.0', newValue: '别名' },
        ],
        created_at: '2026-08-21T00:00:00.000Z',
        status: 'synced',
        created_by: 'private-user',
        message: 'private-message',
        reviewed_at: '2026-08-21T01:00:00.000Z',
      },
    ];
    const artifactRows = syncedHistoryArtifactToPublicRows(
      createSyncedHistoryArtifactPayload(parseSyncedHistorySourcePayload(source))
    );

    expect(selectPublishedWikiHistory(snapshot, artifactRows)).toEqual(
      selectPublishedWikiHistory(snapshot, fullRows)
    );
  });
});
