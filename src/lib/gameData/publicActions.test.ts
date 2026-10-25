import { createApprovedActionArtifactPayload } from './approvedActionArtifact';
import { fetchPublicGameDataActionHistory, getEntityUpdateHistory } from './publicActions';
import type { PublicActionRow } from './publicActionsTypes';
import {
  readCachedApprovedActionRows,
  readCachedSyncedHistoryRows,
  readFreshApprovedActionRows,
  readFreshSyncedHistoryRows,
} from './runtimeActionSources';
import { createSyncedHistoryArtifactPayload } from './syncedHistory';

const mockArtifactPath = jest.fn<string | undefined, []>(() => undefined);
const mockReadArtifact = jest.fn();

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS: 3600,
  getPublicGameDataDomainCacheTag: (entityType: string) => `public-game-data-actions:${entityType}`,
}));
jest.mock('./published/buildIdentity', () => ({ PRODUCTION_BUILD_IDENTITY: 'history-test-build' }));
jest.mock('next/cache', () => ({ unstable_cache: (callback: unknown) => callback }));
jest.mock('@/lib/supabase/buildSourceGuard', () => ({
  getBuildGameDataArtifactPath: () => mockArtifactPath(),
}));
jest.mock('@/lib/gameData/buildArtifactReader', () => ({
  readBuildGameDataArtifact: (...args: unknown[]) => mockReadArtifact(...args),
}));
jest.mock('@/lib/gameData/runtimeActionSources', () => ({
  readCachedApprovedActionRows: jest.fn(),
  readCachedSyncedHistoryRows: jest.fn(),
  readFreshApprovedActionRows: jest.fn(),
  readFreshSyncedHistoryRows: jest.fn(),
}));

const mockReadApprovedRows = jest.mocked(readCachedApprovedActionRows);
const mockReadSyncedRows = jest.mocked(readCachedSyncedHistoryRows);

const approvedRows: PublicActionRow[] = [
  {
    id: 'approved-character-row',
    entity_type: 'characters',
    entry: {
      op: 'set',
      path: 'Tom.description',
      oldValue: 'old',
      newValue: 'new',
    },
    created_at: '2026-05-09T00:00:00.000Z',
    status: 'approved',
    message: null,
    reviewed_at: null,
    created_by: null,
  },
];

const syncedRows: PublicActionRow[] = [
  {
    id: 'build-synced-history-0',
    entity_type: 'items',
    entry: [{ op: 'set', path: '火箭.description' }],
    created_at: '2026-05-10T00:00:00.000Z',
    status: 'synced',
    message: null,
    reviewed_at: null,
    created_by: null,
  },
];

describe('public game data actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockArtifactPath.mockReturnValue(undefined);
    mockReadApprovedRows.mockResolvedValue(approvedRows);
    mockReadSyncedRows.mockResolvedValue(syncedRows);
    jest.mocked(readFreshApprovedActionRows).mockResolvedValue(approvedRows);
    jest.mocked(readFreshSyncedHistoryRows).mockResolvedValue(syncedRows);
  });

  it('keeps domain history separate from aggregate cache reads', async () => {
    await expect(fetchPublicGameDataActionHistory('items')).resolves.toEqual(syncedRows);
    await expect(fetchPublicGameDataActionHistory('characters')).resolves.toEqual(approvedRows);
    expect(mockReadApprovedRows).not.toHaveBeenCalled();
    expect(mockReadSyncedRows).not.toHaveBeenCalled();
  });

  it('merges approved rows with the compact synced projection in deterministic order', async () => {
    await expect(fetchPublicGameDataActionHistory()).resolves.toEqual([
      approvedRows[0],
      syncedRows[0],
    ]);
    expect(mockReadApprovedRows).toHaveBeenCalledTimes(1);
    expect(mockReadSyncedRows).toHaveBeenCalledTimes(1);
  });

  it('uses the action id to break approved update-history timestamp ties', async () => {
    mockReadApprovedRows.mockResolvedValue([
      approvedRows[0]!,
      {
        ...approvedRows[0]!,
        id: 'approved-character-row-later',
        entry: {
          op: 'set',
          path: 'Tom.name',
          oldValue: 'Tom',
          newValue: 'Thomas',
        },
      },
    ]);
    mockReadSyncedRows.mockResolvedValue([]);

    const history = await getEntityUpdateHistory();

    expect(history.get('characters:Tom')).toMatchObject({
      actionId: 'approved-character-row-later',
      affectedPath: 'Tom.name',
    });
  });

  it('includes compact synced rows in entity update history', async () => {
    const history = await getEntityUpdateHistory();

    expect(history.get('items:火箭')).toMatchObject({
      actionId: 'build-synced-history-0',
      status: 'synced',
      affectedPath: '火箭.description',
    });
  });

  it('updates both character endpoints for a shared relation edit', async () => {
    mockReadApprovedRows.mockResolvedValue([
      approvedRows[0]!,
      {
        ...approvedRows[0]!,
        id: 'shared-pair-edit',
        created_at: '2026-05-11T00:00:00.000Z',
        entry: {
          op: 'set',
          path: 'Jerry.characterRelationOverrides.Tom',
          oldValue: null,
          newValue: { kind: 'counteredBy', description: 'shared edit', isMinor: false },
        },
      },
    ]);
    mockReadSyncedRows.mockResolvedValue([]);

    const history = await getEntityUpdateHistory();

    for (const id of ['Jerry', 'Tom']) {
      expect(history.get(`characters:${id}`)).toMatchObject({
        actionId: 'shared-pair-edit',
        updatedAt: '2026-05-11T00:00:00.000Z',
        affectedPath: 'Jerry.characterRelationOverrides.Tom',
      });
    }
  });

  it('preserves both endpoints when shared relation history has been compacted', async () => {
    mockReadSyncedRows.mockResolvedValue([
      {
        ...syncedRows[0]!,
        entity_type: 'characters',
        entry: [{ op: 'set', path: 'Jerry.characterRelationOverrides.Tom' }],
      },
    ]);

    const history = await getEntityUpdateHistory();

    for (const id of ['Jerry', 'Tom']) {
      expect(history.get(`characters:${id}`)).toMatchObject({
        actionId: 'build-synced-history-0',
        status: 'synced',
        affectedPath: 'Jerry.characterRelationOverrides.Tom',
      });
    }
  });

  it('keeps a newer reverse endpoint edit after an older shared relation removal', async () => {
    mockReadApprovedRows.mockResolvedValue([
      {
        ...approvedRows[0]!,
        created_at: '2026-05-11T00:00:00.000Z',
      },
      {
        ...approvedRows[0]!,
        id: 'shared-pair-removal',
        entry: [
          {
            op: 'set',
            path: 'Jerry.characterRelationOverrides.Tom',
            oldValue: { kind: 'counteredBy', description: 'shared edit', isMinor: false },
            newValue: null,
          },
        ],
      },
    ]);
    mockReadSyncedRows.mockResolvedValue([]);

    const history = await getEntityUpdateHistory();

    expect(history.get('characters:Jerry')?.actionId).toBe('shared-pair-removal');
    expect(history.get('characters:Tom')?.actionId).toBe('approved-character-row');
  });

  it('propagates history acquisition failures instead of caching an empty update map', async () => {
    const failure = new Error('history unavailable');
    mockReadSyncedRows.mockRejectedValueOnce(failure);
    await expect(getEntityUpdateHistory()).rejects.toBe(failure);
    await expect(fetchPublicGameDataActionHistory()).resolves.toHaveLength(2);
  });

  it('uses both checked build-artifact projections without runtime source reads', async () => {
    mockArtifactPath.mockReturnValue('D:/artifact.json');
    mockReadArtifact.mockResolvedValue({
      approvedActions: createApprovedActionArtifactPayload(3, approvedRows.length, approvedRows),
      syncedHistory: createSyncedHistoryArtifactPayload({
        sourceActionCount: 1,
        rowCount: 1,
        operationCount: 1,
        rows: [
          {
            entityType: 'items',
            createdAt: '2026-05-10T00:00:00.000Z',
            actions: [{ op: 'set', path: '火箭.description' }],
          },
        ],
      }),
    });

    const rows = await fetchPublicGameDataActionHistory();

    expect(rows).toEqual([approvedRows[0], syncedRows[0]]);
    expect(mockReadArtifact).toHaveBeenCalledTimes(2);
    expect(mockReadApprovedRows).not.toHaveBeenCalled();
    expect(mockReadSyncedRows).not.toHaveBeenCalled();
  });
});
