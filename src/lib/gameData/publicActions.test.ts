import { createApprovedActionArtifactPayload } from './approvedActionArtifact';
import { PublicActionQueryError } from './publicActionQueries';
import {
  fetchPublicGameDataActionHistory,
  fetchPublicGameDataActions,
  getEntityUpdateHistory,
} from './publicActions';
import type { PublicActionRow } from './publicActionsTypes';
import { readCachedApprovedActionRows, readCachedSyncedHistoryRows } from './runtimeActionSources';
import { createSyncedHistoryArtifactPayload } from './syncedHistory';

const mockArtifactPath = jest.fn<string | undefined, []>(() => undefined);
const mockReadArtifact = jest.fn();

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));
jest.mock('@/lib/supabase/buildSourceGuard', () => ({
  getBuildGameDataArtifactPath: () => mockArtifactPath(),
}));
jest.mock('@/lib/gameData/buildArtifactReader', () => ({
  readBuildGameDataArtifact: (...args: unknown[]) => mockReadArtifact(...args),
}));
jest.mock('@/lib/gameData/runtimeActionSources', () => ({
  readCachedApprovedActionRows: jest.fn(),
  readCachedSyncedHistoryRows: jest.fn(),
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
  });

  it('reads approved rows through the shared runtime acquisition module', async () => {
    await expect(fetchPublicGameDataActions()).resolves.toEqual(approvedRows);
    expect(mockReadApprovedRows).toHaveBeenCalledTimes(1);
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

  it('returns an empty fallback after an acquisition failure and retries later', async () => {
    const cause = { message: 'temporary source failure' };
    const failure = new PublicActionQueryError('source failed', cause);
    mockReadApprovedRows.mockRejectedValueOnce(failure).mockResolvedValueOnce(approvedRows);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(fetchPublicGameDataActions()).resolves.toEqual([]);
    await expect(fetchPublicGameDataActions()).resolves.toEqual(approvedRows);

    expect(consoleError).toHaveBeenCalledWith('Error fetching public game data actions:', cause);
    consoleError.mockRestore();
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
