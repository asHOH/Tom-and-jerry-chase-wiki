import { act, renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';

import type { GameDataActionStatusFilter } from '@/lib/gameData/adminActionTypes';

import { useGameDataActionList } from './useGameDataActionList';

let authChanged: (event: string, session: { user: { id: string } } | null) => void;
const unsubscribe = jest.fn();
jest.mock('@/lib/supabase/browserClient', () => ({
  getOptionalSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: (callback: typeof authChanged) => {
        authChanged = callback;
        callback('INITIAL_SESSION', { user: { id: 'moderator-1' } });
        return { data: { subscription: { unsubscribe } } };
      },
    },
  }),
}));

const originalFetch = global.fetch;
const fetchMock = jest.fn();
const response = (count: number | null) =>
  ({
    ok: true,
    json: async () => ({
      submissions: [],
      currentPage: 1,
      totalCount: count,
      totalPages: count === null ? null : Math.ceil(count / 50),
    }),
  }) as Response;

function setup() {
  const cache = new Map();
  return renderHook(
    ({ page, status, permission, enabled }) =>
      useGameDataActionList(enabled, [status, null, null], page, permission),
    {
      initialProps: {
        page: 1,
        status: 'pending' as GameDataActionStatusFilter,
        permission: 'global',
        enabled: true,
      },
      wrapper: ({ children }) => (
        <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
      ),
    }
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  fetchMock.mockImplementation(async (url: string) =>
    response(url.includes('count=none') ? null : 101)
  );
});
afterEach(() => {
  global.fetch = originalFetch;
});

it('counts once per filter, reuses pages, and refreshes only the active view', async () => {
  const { result, rerender } = setup();
  await waitFor(() => expect(result.current.data?.totalCount).toBe(101));
  rerender({ page: 2, status: 'pending', permission: 'global', enabled: true });
  await waitFor(() => expect(result.current.data?.currentPage).toBe(2));
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/game-data-actions/admin?status=pending&page=2&count=none'
  );
  rerender({ page: 1, status: 'pending', permission: 'global', enabled: true });
  expect(result.current.data?.currentPage).toBe(1);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  rerender({ page: 1, status: 'approved', permission: 'global', enabled: true });
  await waitFor(() => expect(result.current.data?.totalCount).toBe(101));
  expect(fetchMock).toHaveBeenLastCalledWith('/api/game-data-actions/admin?status=approved&page=1');
  act(() => result.current.refresh());
  await waitFor(() => expect(result.current.data?.totalCount).toBe(101));
  expect(fetchMock).toHaveBeenCalledTimes(4);
  rerender({ page: 1, status: 'pending', permission: 'global', enabled: true });
  await waitFor(() => expect(result.current.data?.totalCount).toBe(101));
  expect(fetchMock).toHaveBeenCalledTimes(5);
  expect(fetchMock).toHaveBeenLastCalledWith('/api/game-data-actions/admin?status=pending&page=1');
  rerender({ page: 1, status: 'pending', permission: 'global', enabled: false });
  rerender({ page: 1, status: 'pending', permission: 'global', enabled: true });
  await act(async () => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
  });
  expect(fetchMock).toHaveBeenCalledTimes(5);
});

it('does not let a pre-refresh response restore old pages or totals', async () => {
  let finishOld!: (value: Response) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        finishOld = resolve;
      })
  );
  const { result, rerender } = setup();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  act(() => result.current.refresh());
  await waitFor(() => expect(result.current.data?.totalCount).toBe(101));
  await act(async () => finishOld(response(999)));
  expect(result.current.data?.totalCount).toBe(101);
  rerender({ page: 2, status: 'pending', permission: 'global', enabled: true });
  await waitFor(() => expect(result.current.data?.currentPage).toBe(2));
  expect(result.current.data?.totalCount).toBe(101);
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/game-data-actions/admin?status=pending&page=2&count=none'
  );
});

it('discards data on account and permission changes but not token refresh', async () => {
  const { result, rerender } = setup();
  await waitFor(() => expect(result.current.data?.totalCount).toBe(101));
  act(() => authChanged('TOKEN_REFRESHED', { user: { id: 'moderator-1' } }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  act(() => authChanged('SIGNED_IN', { user: { id: 'moderator-2' } }));
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data?.totalCount).toBe(101));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  rerender({ page: 1, status: 'pending', permission: 'characters-only', enabled: true });
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data?.totalCount).toBe(101));
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('retains empty totals and supports manual retry after failure', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false } as Response);
  const { result } = setup();
  await waitFor(() => expect(result.current.error).toBeDefined());
  fetchMock.mockResolvedValueOnce(response(0));
  act(() => result.current.refresh());
  await waitFor(() => expect(result.current.data?.totalCount).toBe(0));
  expect(result.current.data?.currentPage).toBe(0);
  expect(result.current.data?.totalPages).toBe(0);
});
