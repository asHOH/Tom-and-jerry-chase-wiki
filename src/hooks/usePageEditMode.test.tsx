import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import { getActionsStorageKey, readActionHistory, writeActionHistory } from '@/lib/edit/diffUtils';
import { EditModeContext } from '@/context/EditModeContext';
import type { PendingActionAwarenessSource } from '@/context/PendingActionAwarenessContext';
import { clearTestEditRuntime, installTestEditRuntime } from '@/testUtils/editRuntime';

import { usePageEditMode } from './usePageEditMode';

const mockShowToast = jest.fn();
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

const TEST_CHARACTER_ID = '__page_edit_mode_character__';
const marySpecialSkillsOriginal = [
  { name: '魔术漂浮', description: '通用特技。' },
  { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
];
const marySpecialSkillsFinal = [{ name: '魔术漂浮', description: '通用特技。' }];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

let runtime: ActiveEditRuntime;
let characters: ActiveEditRuntime['stores']['characters'];

function PageEditModeProbe() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const { isDirty, draftsSummary, advancedSubmit, discardChanges, publishChanges, getActionCount } =
    usePageEditMode({
      entityType: 'characters',
      entityId: TEST_CHARACTER_ID,
      showToast: mockShowToast,
      ...(mockPendingAwareness === undefined ? {} : { pendingAwareness: mockPendingAwareness }),
    });
  void refreshCount;

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
      <div data-testid='page-dirty'>{String(isDirty)}</div>
      <div data-testid='page-action-count'>{getActionCount()}</div>
      <div data-testid='advanced-submit-available'>{String(advancedSubmit.available)}</div>
      <div data-testid='advanced-submit-outcome'>{advancedSubmit.defaultOutcome}</div>
      <div data-testid='advanced-submit-modes'>{advancedSubmit.modes.join(',')}</div>
      <div data-testid='drafts-summary'>
        {draftsSummary.map((draft) => `${draft.entityType}:${draft.entityId}`).join(',')}
      </div>
      <div data-testid='publish-result'>{publishResult}</div>
      <button type='button' onClick={() => setRefreshCount((count) => count + 1)}>
        refresh
      </button>
      <button type='button' onClick={() => discardChanges()}>
        discard
      </button>
      <button type='button' onClick={() => publish('hook publish')}>
        publish
      </button>
      <button type='button' onClick={() => publish('changed publish')}>
        publish-changed
      </button>
      <button
        type='button'
        onClick={() => publish('hook publish', { pendingAcknowledgementToken: 'v1:acknowledged' })}
      >
        publish-acknowledged
      </button>
      <button
        type='button'
        onClick={() => publish('hook publish', { submitMode: 'force_public_pending' })}
      >
        publish-force-public-pending
      </button>
      <button
        type='button'
        onClick={() => publish('hook publish', { submitMode: 'force_pending' })}
      >
        publish-force-pending
      </button>
    </div>
  );
}

function renderInEditMode() {
  render(
    <EditModeContext.Provider
      value={{
        isEditMode: true,
        isLoading: false,
        isPreviewMode: false,
        setIsPreviewMode: () => {},
      }}
    >
      <PageEditModeProbe />
    </EditModeContext.Provider>
  );
}

describe('usePageEditMode', () => {
  beforeEach(() => {
    runtime = installTestEditRuntime();
    characters = runtime.stores.characters;
    mockPermissionProfile = 'contributor';
    mockShowToast.mockClear();
    mockPendingAwareness = undefined;
    window.localStorage.clear();
    window.sessionStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    clearTestEditRuntime(runtime);
    window.localStorage.clear();
    window.sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('should discard only the current entity draft and preserve remaining drafts', async () => {
    renderInEditMode();

    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: 'canonical description',
          newValue: 'draft description',
        },
        {
          op: 'set',
          path: '__other_character__.description',
          oldValue: 'other canonical description',
          newValue: 'other draft description',
        },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('page-action-count')).toHaveTextContent('1');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'discard' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('page-dirty')).toHaveTextContent('false');
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([
        expect.objectContaining({
          op: 'set',
          path: '__other_character__.description',
          newValue: 'other draft description',
        }),
      ]);
    });
  });

  it('should count repeated same-path edits as one publishable change', async () => {
    renderInEditMode();

    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.skills.0.description`,
          oldValue: 'canonical description',
          newValue: 'draft description',
        },
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.skills.0.description`,
          oldValue: 'draft description',
          newValue: 'final description',
        },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('page-action-count')).toHaveTextContent('1');
    });
  });

  it('should publish only the current entity draft and preserve remaining drafts', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        result: [{ id: 'action-1', is_public: false, status: 'pending' }],
      }),
    });
    global.fetch = fetchMock;
    renderInEditMode();

    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: 'canonical description',
          newValue: 'draft description',
        },
        {
          op: 'set',
          path: '__other_character__.description',
          oldValue: 'other canonical description',
          newValue: 'other draft description',
        },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('page-action-count')).toHaveTextContent('1');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': expect.any(String),
        }),
        body: JSON.stringify({
          entityType: 'characters',
          entries: [
            {
              op: 'set',
              path: `${TEST_CHARACTER_ID}.description`,
              oldValue: 'canonical description',
              newValue: 'draft description',
            },
          ],
          message: 'hook publish',
        }),
      });
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([
        expect.objectContaining({
          op: 'set',
          path: '__other_character__.description',
          newValue: 'other draft description',
        }),
      ]);
    });
  });

  it('should expose reviewer submit modes and send force_public_pending when requested', async () => {
    mockPermissionProfile = 'reviewer';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        result: [{ id: 'action-1', is_public: true, status: 'pending' }],
      }),
    });
    global.fetch = fetchMock;
    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: 'canonical description',
          newValue: 'draft description',
        },
      ])
    );

    renderInEditMode();
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('advanced-submit-available')).toHaveTextContent('true');
      expect(screen.getByTestId('advanced-submit-outcome')).toHaveTextContent('approved');
      expect(screen.getByTestId('advanced-submit-modes')).toHaveTextContent(
        'default,force_public_pending,force_pending'
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish-force-public-pending' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': expect.any(String),
        }),
        body: JSON.stringify({
          entityType: 'characters',
          entries: [
            {
              op: 'set',
              path: `${TEST_CHARACTER_ID}.description`,
              oldValue: 'canonical description',
              newValue: 'draft description',
            },
          ],
          message: 'hook publish',
          submitMode: 'force_public_pending',
        }),
      });
    });
  });

  it('should summarize drafts across entity domains while editing one route', async () => {
    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: 'canonical description',
          newValue: 'draft description',
        },
      ])
    );
    window.localStorage.setItem(
      getActionsStorageKey('items'),
      JSON.stringify([
        {
          op: 'set',
          path: '__cross_domain_item__.description',
          oldValue: 'canonical item description',
          newValue: 'draft item description',
        },
      ])
    );

    renderInEditMode();

    await waitFor(() => {
      expect(screen.getByTestId('drafts-summary')).toHaveTextContent(
        `characters:${TEST_CHARACTER_ID}`
      );
      expect(screen.getByTestId('drafts-summary')).toHaveTextContent('items:__cross_domain_item__');
    });
  });

  it.each([
    {
      error: 'dependent_rows',
      message: '这些修改存在顺序依赖，草稿已保留。',
      requestId: 'request-123',
    },
    {
      error: 'candidate_conflict',
      message: '发布前的数据兼容性检查未通过。草稿已保留。',
      requestId: 'request-456',
    },
  ])('should show $error guidance with a request ID and retain the draft', async (errorBody) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue(errorBody),
    });
    renderInEditMode();

    const draft = {
      op: 'set',
      path: `${TEST_CHARACTER_ID}.description`,
      oldValue: 'canonical description',
      newValue: 'draft description',
    };
    window.localStorage.setItem(getActionsStorageKey('characters'), JSON.stringify([draft]));
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        `${errorBody.message}（请求编号：${errorBody.requestId}）`
      );
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([draft]);
    });
  });

  it('should normalize structural array churn for action counts and publishing', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        result: [{ id: 'action-1', is_public: false, status: 'pending' }],
      }),
    });
    global.fetch = fetchMock;
    characters[TEST_CHARACTER_ID] = {
      id: TEST_CHARACTER_ID,
      name: '玛丽',
      specialSkills: marySpecialSkillsFinal,
    } as unknown as (typeof characters)[string];

    renderInEditMode();

    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'delete',
          path: `${TEST_CHARACTER_ID}.specialSkills.1`,
          oldValue: marySpecialSkillsOriginal[1],
        },
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.specialSkills.length`,
          oldValue: 2,
          newValue: 1,
        },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('page-action-count')).toHaveTextContent('1');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': expect.any(String),
        }),
        body: JSON.stringify({
          entityType: 'characters',
          entries: [
            {
              op: 'set',
              path: `${TEST_CHARACTER_ID}.specialSkills`,
              oldValue: marySpecialSkillsOriginal,
              newValue: marySpecialSkillsFinal,
            },
          ],
          message: 'hook publish',
        }),
      });
    });
  });

  it.each([
    ['pending', { is_public: false, status: 'pending' }, '改动已提交，等待审核'],
    [
      'public_pending',
      { is_public: true, status: 'pending' },
      '改动已提交，已自动公开，后续仍可复核',
    ],
    ['approved', { is_public: true, status: 'approved' }, '改动已提交，已自动审核通过并公开'],
  ] as const)(
    'shows the %s success toast from the actual publish result',
    async (_label, result, expectedToast) => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ result: [{ id: 'action-1', ...result }] }),
      });
      global.fetch = fetchMock;
      renderInEditMode();

      window.localStorage.setItem(
        getActionsStorageKey('characters'),
        JSON.stringify([
          {
            op: 'set',
            path: `${TEST_CHARACTER_ID}.description`,
            oldValue: 'canonical description',
            newValue: 'draft description',
          },
        ])
      );
      fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'publish' }));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(expectedToast);
      });
    }
  );

  it('preserves same-scope and unrelated entries appended while publishing and stays in edit mode', async () => {
    const response = deferred<{ ok: boolean; json: () => Promise<unknown> }>();
    const fetchMock = jest.fn().mockReturnValue(response.promise);
    global.fetch = fetchMock;
    const submitted = {
      op: 'set' as const,
      path: `${TEST_CHARACTER_ID}.description`,
      oldValue: 'canonical description',
      newValue: 'published description',
    };
    const sameScopeAppend = {
      op: 'set' as const,
      path: `${TEST_CHARACTER_ID}.name`,
      oldValue: '玛丽',
      newValue: '玛丽（新）',
    };
    const unrelatedAppend = [
      {
        op: 'set' as const,
        path: '__other_character__.description',
        oldValue: 'old',
        newValue: 'new',
      },
      {
        op: 'set' as const,
        path: '__other_character__.name',
        oldValue: '旧名字',
        newValue: '新名字',
      },
    ];
    writeActionHistory(getActionsStorageKey('characters'), [submitted]);
    renderInEditMode();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    writeActionHistory(getActionsStorageKey('characters'), [
      submitted,
      sameScopeAppend,
      unrelatedAppend,
    ]);
    await act(async () => {
      response.resolve({
        ok: true,
        json: async () => ({ result: [{ id: 'action-1', is_public: false, status: 'pending' }] }),
      });
      await response.promise;
    });

    await waitFor(() => {
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([
        sameScopeAppend,
        unrelatedAppend,
      ]);
      expect(screen.getByTestId('publish-result')).toHaveTextContent('false');
    });
  });

  it('keeps divergent history untouched and blocks a changed operation fingerprint', async () => {
    const response = deferred<{ ok: boolean; json: () => Promise<unknown> }>();
    const fetchMock = jest.fn().mockReturnValue(response.promise);
    global.fetch = fetchMock;
    const submitted = {
      op: 'set' as const,
      path: `${TEST_CHARACTER_ID}.description`,
      oldValue: 'old',
      newValue: 'published',
    };
    const divergent = {
      op: 'set' as const,
      path: `${TEST_CHARACTER_ID}.description`,
      oldValue: 'other old',
      newValue: 'other draft',
    };
    writeActionHistory(getActionsStorageKey('characters'), [submitted]);
    renderInEditMode();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    writeActionHistory(getActionsStorageKey('characters'), [divergent]);
    await act(async () => {
      response.resolve({
        ok: true,
        json: async () => ({ result: [{ id: 'action-1', is_public: false, status: 'pending' }] }),
      });
      await response.promise;
    });

    await waitFor(() => {
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([divergent]);
      expect(screen.getByTestId('publish-result')).toHaveTextContent('false');
      expect(mockShowToast).toHaveBeenCalledWith(
        '发布成功，但本地草稿历史已变化，未清理已发布草稿，请确认后重试。'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'publish-changed' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(mockShowToast).toHaveBeenCalledWith(
        '当前发布操作仍待处理，请先完成清理或放弃草稿后再提交不同修改。'
      );
    });
  });

  it('keeps the operation ID across transport failure and acknowledgement retry', async () => {
    const success = {
      ok: true,
      json: async () => ({ result: [{ id: 'action-1', is_public: false, status: 'pending' }] }),
    };
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce(success);
    global.fetch = fetchMock;
    writeActionHistory(getActionsStorageKey('characters'), [
      {
        op: 'set',
        path: `${TEST_CHARACTER_ID}.description`,
        oldValue: 'old',
        newValue: 'draft',
      },
    ]);
    renderInEditMode();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByTestId('publish-result')).toHaveTextContent('false'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0]?.[1]?.headers['Idempotency-Key']).toBe(
      fetchMock.mock.calls[1]?.[1]?.headers['Idempotency-Key']
    );
  });

  it('keeps successful remote feedback when local cleanup and advisory refresh fail', async () => {
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
      path: `${TEST_CHARACTER_ID}.description`,
      oldValue: 'old',
      newValue: 'draft',
    };
    writeActionHistory(getActionsStorageKey('characters'), [submitted]);
    const originalRemoveItem = Storage.prototype.removeItem;
    const removeItem = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
      this: Storage,
      key: string
    ) {
      if (this === window.localStorage) throw new Error('quota');
      return originalRemoveItem.call(this, key);
    });
    renderInEditMode();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([submitted]);
      expect(screen.getByTestId('publish-result')).toHaveTextContent('false');
      expect(mockShowToast).toHaveBeenCalledWith('改动已提交，等待审核');
      expect(mockShowToast).toHaveBeenCalledWith('发布成功，但本地草稿清理失败，请确认后重试。');
      expect(refresh).toHaveBeenCalled();
    });
    removeItem.mockRestore();
  });
});
