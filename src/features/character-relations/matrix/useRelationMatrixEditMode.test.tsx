import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import { getActionsStorageKey, readActionHistory, writeActionHistory } from '@/lib/edit/diffUtils';
import type { PendingActionAwarenessSource } from '@/context/PendingActionAwarenessContext';
import { clearTestEditRuntime, installTestEditRuntime } from '@/testUtils/editRuntime';

import { useRelationMatrixEditMode } from './useRelationMatrixEditMode';

const mockInfo = jest.fn();
const mockError = jest.fn();
const mockShowSubmissionFeedback = jest.fn();
let mockPermissionProfile: 'contributor' | 'reviewer' | 'coordinator' | null = 'contributor';
let mockPendingAwareness: PendingActionAwarenessSource | undefined;

jest.mock('@/lib/auth/PermissionProvider', () => {
  const actual = jest.requireActual('@/lib/auth/permissions');
  const fixtures = jest.requireActual('@/testUtils/permissionFixtures');
  return {
    usePermissions: () => {
      const grants = fixtures.permissionGrantsForProfile(mockPermissionProfile);
      return {
        grants,
        has: (permission: string) => actual.hasPermission(grants, permission),
        can: (permission: string, context?: unknown) =>
          actual.canAccess(grants, permission, context),
        canAll: (permission: string, contexts: unknown[]) =>
          actual.canAccessAll(grants, permission, contexts),
      };
    },
  };
});

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    info: mockInfo,
    error: mockError,
  }),
}));

jest.mock('@/hooks/useContributionSubmissionFeedback', () => ({
  useContributionSubmissionFeedback: () => mockShowSubmissionFeedback,
}));

const storageKey = getActionsStorageKey('characters');
const relationCountersOriginal = [{ id: '汤姆' }, { id: '布奇' }];
const relationCountersFinal = [{ id: '汤姆' }];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

let runtime: ActiveEditRuntime;
let characters: ActiveEditRuntime['stores']['characters'];

function RelationEditModeProbe() {
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    advancedSubmit,
    discardChanges,
    publishChanges,
    getActionCount,
  } = useRelationMatrixEditMode(mockPendingAwareness);

  const publish = (
    message?: string,
    options?: {
      pendingAcknowledgementToken?: string;
      submitMode?: 'force_public_pending' | 'force_pending';
    }
  ) => {
    void publishChanges(message, options).then((result) => setPublishResult(String(result)));
  };

  return (
    <div>
      <div data-testid='dirty'>{String(isDirty)}</div>
      <div data-testid='publishing'>{String(isPublishing)}</div>
      <div data-testid='count'>{getActionCount()}</div>
      <div data-testid='draft-info'>{draftInfo?.actionCount ?? 0}</div>
      <div data-testid='advanced-submit-available'>{String(advancedSubmit.available)}</div>
      <div data-testid='advanced-submit-outcome'>{advancedSubmit.defaultOutcome}</div>
      <div data-testid='advanced-submit-modes'>{advancedSubmit.modes.join(',')}</div>
      <div data-testid='draft-summary'>{draftsSummary.map((item) => item.itemLabel).join(',')}</div>
      <div data-testid='publish-result'>{publishResult}</div>
      <button type='button' onClick={() => discardChanges()}>
        discard
      </button>
      <button type='button' onClick={() => publish('关系更新')}>
        publish
      </button>
      <button
        type='button'
        onClick={() => publish('关系更新', { pendingAcknowledgementToken: 'v1:acknowledged' })}
      >
        publish-acknowledged
      </button>
      <button
        type='button'
        onClick={() => publish('关系更新', { submitMode: 'force_public_pending' })}
      >
        publish-force-public-pending
      </button>
      <button type='button' onClick={() => publish('关系更新', { submitMode: 'force_pending' })}>
        publish-force-pending
      </button>
    </div>
  );
}

const renderProbe = () => render(<RelationEditModeProbe />);

describe('useRelationMatrixEditMode', () => {
  beforeEach(() => {
    runtime = installTestEditRuntime();
    characters = runtime.stores.characters;
    mockPermissionProfile = 'contributor';
    mockPendingAwareness = undefined;
    window.localStorage.clear();
    window.sessionStorage.clear();
    mockInfo.mockClear();
    mockError.mockClear();
    mockShowSubmissionFeedback.mockClear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    clearTestEditRuntime(runtime);
    window.localStorage.clear();
    window.sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('counts relation actions and excludes unrelated character drafts', () => {
    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      [
        { op: 'set', path: '汤姆.counteredBy', oldValue: [], newValue: [{ id: '杰瑞' }] },
        { op: 'set', path: '汤姆.description', oldValue: 'old', newValue: 'new' },
      ],
    ]);

    renderProbe();

    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
    expect(screen.getByTestId('draft-info')).toHaveTextContent('2');
    expect(screen.getByTestId('draft-summary')).toHaveTextContent('杰瑞');
    expect(screen.getByTestId('draft-summary')).toHaveTextContent('汤姆');
  });

  it('publishes only relation actions and preserves unrelated character drafts', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        result: [{ id: 'action-1', is_public: false, status: 'pending' }],
      }),
    });
    global.fetch = fetchMock;
    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
    ]);
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish-relations', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': expect.any(String),
        }),
        body: JSON.stringify({
          entries: [{ op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] }],
          message: '关系更新',
        }),
      });
      expect(readActionHistory(storageKey)).toEqual([
        { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      ]);
    });
  });

  it('exposes reviewer submit modes and sends force_public_pending when requested', async () => {
    mockPermissionProfile = 'reviewer';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        result: [{ id: 'action-1', is_public: true, status: 'pending' }],
      }),
    });
    global.fetch = fetchMock;
    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
    ]);
    renderProbe();

    expect(screen.getByTestId('advanced-submit-available')).toHaveTextContent('true');
    expect(screen.getByTestId('advanced-submit-outcome')).toHaveTextContent('approved');
    expect(screen.getByTestId('advanced-submit-modes')).toHaveTextContent(
      'default,force_public_pending,force_pending'
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish-force-public-pending' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish-relations', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': expect.any(String),
        }),
        body: JSON.stringify({
          entries: [{ op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] }],
          message: '关系更新',
          submitMode: 'force_public_pending',
        }),
      });
    });
  });

  it('normalizes relation structural arrays with the current characters root when publishing', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        result: [{ id: 'action-1', is_public: false, status: 'pending' }],
      }),
    });
    global.fetch = fetchMock;
    (characters['杰瑞'] as unknown as { counters?: unknown }).counters = relationCountersFinal;
    writeActionHistory(storageKey, [
      {
        op: 'delete',
        path: '杰瑞.counters.1',
        oldValue: relationCountersOriginal[1],
        newValue: undefined,
      },
      {
        op: 'set',
        path: '杰瑞.counters.length',
        oldValue: 2,
        newValue: 1,
      },
    ]);

    renderProbe();

    expect(screen.getByTestId('count')).toHaveTextContent('1');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish-relations', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': expect.any(String),
        }),
        body: JSON.stringify({
          entries: [
            {
              op: 'set',
              path: '杰瑞.counters',
              oldValue: relationCountersOriginal,
              newValue: relationCountersFinal,
            },
          ],
          message: '关系更新',
        }),
      });
    });
  });

  it.each([
    ['pending', { is_public: false, status: 'pending' }, '关系修改已提交，等待审核'],
    [
      'public_pending',
      { is_public: true, status: 'pending' },
      '关系修改已提交，已自动公开，后续仍可复核',
    ],
    ['approved', { is_public: true, status: 'approved' }, '关系修改已提交，已自动审核通过并公开'],
  ] as const)(
    'shows the %s success toast from the actual relation publish result',
    async (_label, result, expectedToast) => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ result: [{ id: 'action-1', ...result }] }),
      });
      global.fetch = fetchMock;
      writeActionHistory(storageKey, [
        { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      ]);
      renderProbe();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'publish' }));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockShowSubmissionFeedback).toHaveBeenCalledWith(expectedToast);
      });
    }
  );

  it.each([
    {
      error: 'dependent_rows',
      message: '这些修改存在顺序依赖，草稿已保留。',
      requestId: 'request-456',
    },
    {
      error: 'candidate_conflict',
      message: '发布前的数据兼容性检查未通过。草稿已保留。',
      requestId: 'request-789',
    },
  ])('shows $error guidance with a request ID and retains relation drafts', async (errorBody) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue(errorBody),
    });
    const draft = {
      op: 'set' as const,
      path: '杰瑞.counters',
      oldValue: [],
      newValue: [{ id: '汤姆' }],
    };
    writeActionHistory(storageKey, [draft]);
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith(
        `${errorBody.message}（请求编号：${errorBody.requestId}）`
      );
      expect(readActionHistory(storageKey)).toEqual([draft]);
    });
  });

  it('discards relation actions with suppressed inverse replay and preserves unrelated drafts', async () => {
    (characters['杰瑞'] as unknown as { counters?: unknown }).counters = [{ id: '汤姆' }];
    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
    ]);
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'discard' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect((characters['杰瑞'] as unknown as { counters?: unknown }).counters).toEqual([]);
      expect(readActionHistory(storageKey)).toEqual([
        { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      ]);
      expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    });
  });

  it('updates dirty state and draft info after relation overlay writes touch the characters store', async () => {
    renderProbe();
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');

    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
    ]);

    await act(async () => {
      (characters['杰瑞'] as unknown as { counters?: unknown }).counters = [{ id: '汤姆' }];
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('dirty')).toHaveTextContent('true');
      expect(screen.getByTestId('draft-info')).toHaveTextContent('1');
    });
  });

  it('preserves same-scope and unrelated entries appended while publishing and stays in edit mode', async () => {
    const response = deferred<{ ok: boolean; json: () => Promise<unknown> }>();
    const fetchMock = jest.fn().mockReturnValue(response.promise);
    global.fetch = fetchMock;
    const submitted = {
      op: 'set' as const,
      path: '杰瑞.counters',
      oldValue: [],
      newValue: [{ id: '汤姆' }],
    };
    const sameScopeAppend = {
      op: 'set' as const,
      path: '汤姆.counteredBy',
      oldValue: [],
      newValue: [{ id: '杰瑞' }],
    };
    const unrelatedAppend = [
      { op: 'set' as const, path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      { op: 'set' as const, path: '杰瑞.name', oldValue: '杰瑞', newValue: '杰瑞（新）' },
    ];
    writeActionHistory(storageKey, [submitted]);
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    writeActionHistory(storageKey, [submitted, sameScopeAppend, unrelatedAppend]);
    await act(async () => {
      response.resolve({
        ok: true,
        json: async () => ({ result: [{ id: 'action-1', is_public: false, status: 'pending' }] }),
      });
      await response.promise;
    });

    await waitFor(() => {
      expect(readActionHistory(storageKey)).toEqual([sameScopeAppend, unrelatedAppend]);
      expect(screen.getByTestId('publish-result')).toHaveTextContent('false');
    });
  });

  it('keeps divergent relation history untouched after a successful remote publish', async () => {
    const response = deferred<{ ok: boolean; json: () => Promise<unknown> }>();
    const fetchMock = jest.fn().mockReturnValue(response.promise);
    global.fetch = fetchMock;
    const submitted = {
      op: 'set' as const,
      path: '杰瑞.counters',
      oldValue: [],
      newValue: [{ id: '汤姆' }],
    };
    const divergent = {
      op: 'set' as const,
      path: '杰瑞.counters',
      oldValue: [{ id: '布奇' }],
      newValue: [{ id: '汤姆' }, { id: '布奇' }],
    };
    writeActionHistory(storageKey, [submitted]);
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    writeActionHistory(storageKey, [divergent]);
    await act(async () => {
      response.resolve({
        ok: true,
        json: async () => ({ result: [{ id: 'action-1', is_public: false, status: 'pending' }] }),
      });
      await response.promise;
    });

    await waitFor(() => {
      expect(readActionHistory(storageKey)).toEqual([divergent]);
      expect(screen.getByTestId('publish-result')).toHaveTextContent('false');
      expect(mockError).toHaveBeenCalledWith(
        '发布成功，但本地草稿历史已变化，未清理已发布关系草稿，请确认后重试。'
      );
    });
  });

  it('reuses the operation ID when acknowledging a pending overlap', async () => {
    const overlap = {
      ok: false,
      status: 409,
      json: async () => ({
        error: 'pending_action_overlap',
        pendingAcknowledgementToken: 'v1:server-token',
        affectedPathCount: 1,
        ownCount: 1,
        otherCount: 1,
        publicCount: 0,
        truncated: false,
      }),
    };
    const success = {
      ok: true,
      json: async () => ({ result: [{ id: 'action-1', is_public: false, status: 'pending' }] }),
    };
    const fetchMock = jest.fn().mockResolvedValueOnce(overlap).mockResolvedValueOnce(success);
    global.fetch = fetchMock;
    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
    ]);
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByTestId('publish-result')).toHaveTextContent('false'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish-acknowledged' }));
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByTestId('publish-result')).toHaveTextContent('true'));
    expect(fetchMock.mock.calls[0]?.[1]?.headers['Idempotency-Key']).toBe(
      fetchMock.mock.calls[1]?.[1]?.headers['Idempotency-Key']
    );
    expect(fetchMock.mock.calls[1]?.[1]?.body).toContain(
      '"pendingAcknowledgementToken":"v1:acknowledged"'
    );
  });

  it('keeps successful relation feedback when local cleanup and awareness refresh fail', async () => {
    const refresh = jest.fn().mockRejectedValue(new Error('awareness unavailable'));
    mockPendingAwareness = {
      targets: [],
      truncated: false,
      isLoading: false,
      error: undefined,
      refresh,
      summarizeActions: () => null,
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        result: [{ id: 'action-1', is_public: false, status: 'pending' }],
      }),
    });
    const submitted = {
      op: 'set' as const,
      path: '杰瑞.counters',
      oldValue: [],
      newValue: [{ id: '汤姆' }],
    };
    writeActionHistory(storageKey, [submitted]);
    const originalRemoveItem = Storage.prototype.removeItem;
    const removeItem = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
      this: Storage,
      key: string
    ) {
      if (this === window.localStorage) throw new Error('quota');
      return originalRemoveItem.call(this, key);
    });
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(readActionHistory(storageKey)).toEqual([submitted]);
      expect(screen.getByTestId('publish-result')).toHaveTextContent('false');
      expect(mockShowSubmissionFeedback).toHaveBeenCalledWith('关系修改已提交，等待审核');
      expect(mockError).toHaveBeenCalledWith('发布成功，但本地关系草稿清理失败，请确认后重试。');
      expect(refresh).toHaveBeenCalled();
    });
    removeItem.mockRestore();
  });
});
