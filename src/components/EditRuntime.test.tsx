import { act, cleanup, render, waitFor } from '@testing-library/react';

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
});
