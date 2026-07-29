import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

import { clearActiveEditRuntime, getActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import { getActionsStorageKey } from '@/lib/edit/diffUtils';
import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data/static';

import EditRuntime from './EditRuntime';

const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const baselineData = {
  achievements,
  characters,
  cards,
  entities,
  buffs,
  items,
  fixtures,
  maps,
  modes,
  specialSkills,
} as unknown as PublishedGameDataByType;

const createFetchResponse = (revision: `v1:${string}`) => ({
  ok: true,
  status: 200,
  json: jest.fn(async () => ({ revision, data: baselineData })),
});

describe('EditRuntime', () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    window.localStorage.clear();
    clearActiveEditRuntime();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    clearActiveEditRuntime();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('fetches one baseline and restores drafts before reporting ready', async () => {
    const characterId = '汤姆';
    const draftDescription = '本地草稿描述';
    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${characterId}.description`,
          oldValue: characters[characterId]!.description,
          newValue: draftDescription,
        },
      ])
    );
    global.fetch = jest.fn().mockResolvedValue(createFetchResponse('v1:matching'));
    const onStatusChange = jest.fn();

    const view = render(
      <EditRuntime
        visibleRevision='v1:matching'
        onStatusChange={onStatusChange}
        onRetry={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenLastCalledWith('ready', undefined);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/game-data-actions/edit-baseline',
      expect.objectContaining({ cache: 'no-store' })
    );
    expect(getActiveEditRuntime()?.stores.characters[characterId]?.description).toBe(
      draftDescription
    );

    view.unmount();
    expect(getActiveEditRuntime()).toBeNull();
  });

  it('refreshes once on a revision mismatch and constructs stores only after revisions match', async () => {
    global.fetch = jest.fn().mockResolvedValue(createFetchResponse('v1:baseline'));
    const onStatusChange = jest.fn();

    const view = render(
      <EditRuntime visibleRevision='v1:stale' onStatusChange={onStatusChange} onRetry={jest.fn()} />
    );

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
    expect(getActiveEditRuntime()).toBeNull();

    view.rerender(
      <EditRuntime
        visibleRevision='v1:baseline'
        onStatusChange={onStatusChange}
        onRetry={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenLastCalledWith('ready', undefined);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getActiveEditRuntime()?.revision).toBe('v1:baseline');
  });

  it('reports a retryable error when the route remains mismatched after refresh', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue(createFetchResponse('v1:baseline'));
    const statuses: Array<[EditRuntimeStatus, string | undefined]> = [];

    render(
      <EditRuntime
        visibleRevision='v1:stale'
        onStatusChange={(status, error) => statuses.push([status, error])}
        onRetry={jest.fn()}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(getActiveEditRuntime()).toBeNull();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(statuses.at(-1)).toEqual(['error', '页面数据版本与编辑基线仍不一致，请重试']);
  });

  it('does not construct a partial runtime when the initial baseline request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const onStatusChange = jest.fn();
    const onRetry = jest.fn();

    render(
      <EditRuntime
        visibleRevision='v1:matching'
        onStatusChange={onStatusChange}
        onRetry={onRetry}
      />
    );

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenLastCalledWith('error', '加载编辑数据失败 (503)');
    });

    expect(getActiveEditRuntime()).toBeNull();
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
  });

  it('keeps the installed runtime and baseline fixed across navigation and mismatch handling', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue(createFetchResponse('v1:baseline'));
    const statuses: Array<[EditRuntimeStatus, string | undefined]> = [];
    const onStatusChange = (status: EditRuntimeStatus, error?: string) =>
      statuses.push([status, error]);

    const view = render(
      <EditRuntime
        visibleRevision='v1:baseline'
        onStatusChange={onStatusChange}
        onRetry={jest.fn()}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    const runtime = getActiveEditRuntime();
    expect(runtime).not.toBeNull();
    const characterId = Object.keys(characters)[0]!;
    const itemId = Object.keys(items)[0]!;
    runtime!.stores.characters[characterId]!.description = '跨域角色草稿';
    runtime!.stores.items[itemId]!.description = '跨域道具草稿';

    view.rerender(
      <EditRuntime
        visibleRevision='v1:newer-route'
        onStatusChange={onStatusChange}
        onRetry={jest.fn()}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(getActiveEditRuntime()).toBe(runtime);
    expect(runtime!.stores.characters[characterId]!.description).toBe('跨域角色草稿');
    expect(runtime!.stores.items[itemId]!.description).toBe('跨域道具草稿');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '重试' })).not.toBeInTheDocument();
    expect(screen.getByText(/请退出编辑模式后重新进入/)).toBeInTheDocument();
  });

  it('creates one fresh baseline and runtime after an explicit exit and re-entry', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(createFetchResponse('v1:first'))
      .mockResolvedValueOnce(createFetchResponse('v1:second'));

    const firstView = render(
      <EditRuntime visibleRevision='v1:first' onStatusChange={jest.fn()} onRetry={jest.fn()} />
    );

    await waitFor(() => {
      expect(getActiveEditRuntime()?.revision).toBe('v1:first');
    });
    const firstRuntime = getActiveEditRuntime();
    firstView.unmount();
    expect(getActiveEditRuntime()).toBeNull();

    const secondView = render(
      <EditRuntime visibleRevision='v1:second' onStatusChange={jest.fn()} onRetry={jest.fn()} />
    );

    await waitFor(() => {
      expect(getActiveEditRuntime()?.revision).toBe('v1:second');
    });

    expect(getActiveEditRuntime()).not.toBe(firstRuntime);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    secondView.unmount();
  });
});
