import type { PublicActionRow } from './publicActionsTypes';
import {
  readCachedApprovedActionRows,
  readCachedSyncedHistoryRows,
  readFreshApprovedActionRows,
} from './runtimeActionSources';

const mockGetPublicClient = jest.fn();

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS: 3600,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));
jest.mock('@/lib/serverCache', () => {
  const cacheDefinitions: unknown[][] = [];
  return {
    cacheDefinitions,
    createCached: (key: unknown, reader: () => Promise<unknown>, options: unknown) => {
      cacheDefinitions.push([key, reader, options]);
      return reader;
    },
  };
});
jest.mock('@/lib/supabase/publicClient', () => ({
  getOptionalSupabasePublicClient: () => mockGetPublicClient(),
}));
jest.mock('./published/buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'runtime-source-test-build',
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const approvedRows: PublicActionRow[] = [
  {
    id: 'approved-row',
    entity_type: 'items',
    entry: { op: 'set', path: '火箭.description', newValue: 'new' },
    created_at: '2026-08-24T00:00:00.000Z',
    status: 'approved',
    message: null,
    reviewed_at: null,
    created_by: null,
  },
];

const query = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
};
const client = {
  from: jest.fn(() => query),
  rpc: jest.fn(),
};

describe('runtime action source acquisition', () => {
  beforeEach(() => {
    mockGetPublicClient.mockReturnValue(client);
    client.from.mockClear();
    client.rpc.mockReset();
    query.select.mockReset().mockReturnValue(query);
    query.eq.mockReset().mockReturnValue(query);
    query.order.mockReset();
  });

  it('defines both persistent readers once at module scope with the shared invalidation tag', () => {
    const { cacheDefinitions } = jest.requireMock('@/lib/serverCache') as {
      cacheDefinitions: unknown[][];
    };

    expect(cacheDefinitions).toEqual([
      [
        ['public-game-data-actions', 'approved-snapshot', 'v1', 'runtime-source-test-build'],
        expect.any(Function),
        { revalidate: 3600, tags: ['public-game-data-actions'] },
      ],
      [
        ['public-game-data-actions', 'synced-history', 'v1', 'runtime-source-test-build'],
        expect.any(Function),
        { revalidate: 3600, tags: ['public-game-data-actions'] },
      ],
    ]);
  });

  it('coalesces a concurrent approved cold miss into one ordered source query', async () => {
    const acquisition = deferred<{ data: PublicActionRow[]; error: null }>();
    query.order.mockImplementation((column: string) =>
      column === 'id' ? acquisition.promise : query
    );

    const readers = Array.from({ length: 40 }, () => readCachedApprovedActionRows());

    expect(client.from).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith('is_public', true);
    acquisition.resolve({ data: approvedRows, error: null });
    await expect(Promise.all(readers)).resolves.toEqual(
      Array.from({ length: 40 }, () => approvedRows)
    );
  });

  it('clears a failed approved acquisition so the next cohort can retry', async () => {
    let terminalQueryCount = 0;
    query.order.mockImplementation((column: string) => {
      if (column !== 'id') return query;
      terminalQueryCount += 1;
      return Promise.resolve(
        terminalQueryCount === 1
          ? { data: null, error: { message: 'temporary failure' } }
          : { data: approvedRows, error: null }
      );
    });

    await expect(readCachedApprovedActionRows()).rejects.toMatchObject({
      name: 'PublicActionQueryError',
    });
    await expect(readCachedApprovedActionRows()).resolves.toEqual(approvedRows);
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it('coalesces fresh edit-baseline reads without retaining a settled value', async () => {
    const first = deferred<{ data: PublicActionRow[]; error: null }>();
    query.order.mockImplementation((column: string) => (column === 'id' ? first.promise : query));

    const readers = Array.from({ length: 20 }, () => readFreshApprovedActionRows());
    expect(client.from).toHaveBeenCalledTimes(1);
    first.resolve({ data: approvedRows, error: null });
    await Promise.all(readers);

    query.order.mockImplementation((column: string) =>
      column === 'id' ? Promise.resolve({ data: approvedRows, error: null }) : query
    );
    await expect(readFreshApprovedActionRows()).resolves.toEqual(approvedRows);
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it('coalesces compact synced-history acquisition and adapts it to history rows', async () => {
    const acquisition = deferred<{
      data: {
        sourceActionCount: number;
        rowCount: number;
        operationCount: number;
        rows: Array<{
          entityType: string;
          createdAt: string;
          actions: Array<{ op: string; path: string }>;
        }>;
      };
      error: null;
    }>();
    client.rpc.mockReturnValue(acquisition.promise);

    const readers = Array.from({ length: 40 }, () => readCachedSyncedHistoryRows());
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(client.rpc).toHaveBeenCalledWith('read_game_data_synced_history_source');
    acquisition.resolve({
      data: {
        sourceActionCount: 1,
        rowCount: 1,
        operationCount: 1,
        rows: [
          {
            entityType: 'items',
            createdAt: '2026-08-23T00:00:00.000Z',
            actions: [{ op: 'set', path: '火箭.description' }],
          },
        ],
      },
      error: null,
    });

    const results = await Promise.all(readers);
    expect(results[0]).toEqual([
      expect.objectContaining({
        id: 'build-synced-history-0',
        entity_type: 'items',
        status: 'synced',
        entry: [{ op: 'set', path: '火箭.description' }],
      }),
    ]);
    expect(results.every((rows) => rows === results[0])).toBe(true);
  });

  it('degrades to empty sources when public Supabase configuration is absent', async () => {
    mockGetPublicClient.mockReturnValue(undefined);

    await expect(readCachedApprovedActionRows()).resolves.toEqual([]);
    await expect(readCachedSyncedHistoryRows()).resolves.toEqual([]);
  });
});
