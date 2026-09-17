import { act, renderHook, waitFor } from '@testing-library/react';

import { performSearch } from '@/lib/searchUtils';
import * as baseline from '@/data/static';

import { useSearchGameData } from './useSearchGameData';

jest.mock('@/data/static', () => ({
  characters: { tom: { id: '汤姆', aliases: [], skills: [] } },
  cards: {},
  entities: {},
  buffs: {},
  items: {},
  fixtures: {},
  maps: {},
  modes: {},
  traits: {},
  specialSkills: { cat: {}, mouse: {} },
  achievements: { cat: {}, mouse: {} },
  itemGroups: {},
}));
jest.mock('@/features/buffs/data/buffMappingTable', () => ({ buffMappingTable: {} }));
jest.mock('@/features/buffs/data/allBuffDetailedDescriptions.json', () => ({}));
jest.mock('@/data/generated/docPages.json', () => []);

const published = {
  revision: 'v1:published',
  data: {
    ...baseline,
    characters: {
      tom: { ...baseline.characters.tom!, aliases: ['同步别名'], description: '离线说明' },
    },
  },
};

function response(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
    clone: () => response(body, ok),
  } as Response;
}

describe('offline search data', () => {
  const originalFetch = global.fetch;
  const originalCaches = window.caches;
  let saved: Response | undefined;
  const match = jest.fn<Promise<Response | undefined>, []>();
  const put = jest.fn<Promise<void>, [string, Response]>();
  const open = jest.fn();

  beforeEach(() => {
    saved = undefined;
    match.mockImplementation(async () => saved);
    put.mockImplementation(async (_key, value) => {
      saved = value;
    });
    open.mockResolvedValue({ match, put });
    Object.defineProperty(window, 'caches', { configurable: true, value: { open } });
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    global.fetch = jest.fn().mockResolvedValue(response(published));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(window, 'caches', { configurable: true, value: originalCaches });
    jest.restoreAllMocks();
  });

  it('searches bundled data immediately while a refresh is stalled', async () => {
    jest.mocked(fetch).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSearchGameData(true));
    expect(result.current).toEqual(baseline);
    expect(await performSearch('汤姆', result.current)).toEqual([
      expect.objectContaining({ href: '/characters/tom' }),
    ]);
  });

  it('persists published data and searches previously unused queries after an offline restart', async () => {
    const first = renderHook(() => useSearchGameData(true));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(first.result.current).toEqual(published.data);
    first.unmount();

    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    jest.mocked(fetch).mockClear();
    const offline = renderHook(() => useSearchGameData(true));
    await waitFor(() => expect(offline.result.current).toEqual(published.data));
    for (const query of ['同步别名', '离线说明']) {
      expect(await performSearch(query, offline.result.current)).toEqual([
        expect.objectContaining({ href: '/characters/tom' }),
      ]);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('falls back to bundled data on the first offline launch and refreshes on reconnect', async () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { result } = renderHook(() => useSearchGameData(true));
    expect(result.current).toEqual(baseline);
    expect(fetch).not.toHaveBeenCalled();

    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => expect(result.current).toEqual(published.data));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the saved snapshot after a network failure', async () => {
    saved = response(published);
    jest.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useSearchGameData(true));
    await waitFor(() => expect(result.current).toEqual(published.data));
    expect(put).not.toHaveBeenCalled();
  });

  it('does not let a late cached read replace a fresh snapshot', async () => {
    let finishRead!: (value: Response) => void;
    match.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRead = resolve;
        })
    );
    const { result } = renderHook(() => useSearchGameData(true));
    await waitFor(() => expect(result.current).toEqual(published.data));
    await act(async () => {
      finishRead(response({ revision: 'v1:old', data: baseline }));
    });
    expect(result.current).toEqual(published.data);
  });

  it.each([
    null,
    { revision: 'v1:broken', data: {} },
    { ...published, data: { ...published.data, characters: [] } },
  ])('ignores malformed cached and network snapshots', async (invalid) => {
    saved = response(invalid);
    jest.mocked(fetch).mockResolvedValue(response(invalid));
    const { result } = renderHook(() => useSearchGameData(true));
    await act(async () => {});
    expect(result.current).toEqual(baseline);
    expect(put).not.toHaveBeenCalled();
  });

  it('uses fresh data even when browser storage is unavailable', async () => {
    Object.defineProperty(window, 'caches', { configurable: true, value: undefined });
    const { result } = renderHook(() => useSearchGameData(true));
    await waitFor(() => expect(result.current).toEqual(published.data));
  });

  it('keeps fresh data across reopening when persisting it exceeds the browser storage quota', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    saved = response({ revision: 'v1:older', data: baseline });
    put.mockRejectedValueOnce(new Error('Quota exceeded'));
    const { result, rerender } = renderHook(({ enabled }) => useSearchGameData(enabled), {
      initialProps: { enabled: true },
    });
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(result.current).toEqual(published.data);
    rerender({ enabled: false });
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    rerender({ enabled: true });
    await act(async () => {});
    expect(result.current).toEqual(published.data);
  });

  it('does not refresh a closed dialog and aborts a pending refresh on close', async () => {
    let finishRefresh!: (value: Response) => void;
    jest.mocked(fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve;
        })
    );
    const { result, rerender } = renderHook(({ enabled }) => useSearchGameData(enabled), {
      initialProps: { enabled: false },
    });
    expect(fetch).not.toHaveBeenCalled();
    rerender({ enabled: true });
    const signal = jest.mocked(fetch).mock.calls[0]?.[1]?.signal;
    rerender({ enabled: false });
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      finishRefresh(response(published));
    });
    expect(result.current).toEqual(baseline);
    expect(put).not.toHaveBeenCalled();
  });
});
