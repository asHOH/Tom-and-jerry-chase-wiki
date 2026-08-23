import { invalidatePublicGameDataActionsCache } from './publicActionsCache';
import type { PublicActionRow } from './publicActionsTypes';
import { readCachedApprovedActionRows } from './runtimeActionSources';

const mockGetPublicClient = jest.fn();

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => {
  const clearers: Array<() => void> = [];
  return {
    unstable_cache: (reader: () => Promise<unknown>) => {
      let value: Promise<unknown> | undefined;
      clearers.push(() => {
        value = undefined;
      });
      return () => {
        value ??= reader().catch((error) => {
          value = undefined;
          throw error;
        });
        return value;
      };
    },
    revalidateTag: jest.fn(() => {
      for (const clear of clearers) clear();
    }),
  };
});
jest.mock('@/env', () => ({
  env: { VERCEL: '0', VERCEL_ENV: undefined },
}));
jest.mock('@/lib/supabase/publicClient', () => ({
  getOptionalSupabasePublicClient: () => mockGetPublicClient(),
}));
jest.mock('./published/buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'invalidation-test-build',
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

const rows: PublicActionRow[] = [
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

describe('runtime action invalidation', () => {
  beforeEach(() => {
    mockGetPublicClient.mockReturnValue(client);
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
  });

  it('expires the tagged value and coalesces the next concurrent reader cohort', async () => {
    query.order.mockImplementation((column: string) =>
      column === 'id' ? Promise.resolve({ data: rows, error: null }) : query
    );
    await expect(readCachedApprovedActionRows()).resolves.toEqual(rows);
    expect(client.from).toHaveBeenCalledTimes(1);

    invalidatePublicGameDataActionsCache();
    const refreshed = deferred<{ data: PublicActionRow[]; error: null }>();
    query.order.mockImplementation((column: string) =>
      column === 'id' ? refreshed.promise : query
    );

    const cohort = Array.from({ length: 40 }, () => readCachedApprovedActionRows());
    expect(client.from).toHaveBeenCalledTimes(2);
    refreshed.resolve({ data: rows, error: null });
    await expect(Promise.all(cohort)).resolves.toHaveLength(40);
    expect(client.from).toHaveBeenCalledTimes(2);
  });
});
