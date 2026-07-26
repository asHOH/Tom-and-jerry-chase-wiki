import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getActionsStorageKey, readActionHistory, writeActionHistory } from '@/lib/edit/diffUtils';
import { characters } from '@/data/store';

import { useRelationMatrixEditMode } from './useRelationMatrixEditMode';

const mockInfo = jest.fn();
const mockSuccess = jest.fn();
const mockError = jest.fn();
let mockPermissionProfile: 'contributor' | 'reviewer' | 'coordinator' | null = 'contributor';

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
    success: mockSuccess,
    error: mockError,
  }),
}));

const storageKey = getActionsStorageKey('characters');
const relationCountersOriginal = [{ id: '汤姆' }, { id: '布奇' }];
const relationCountersFinal = [{ id: '汤姆' }];

function RelationEditModeProbe() {
  const {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    advancedSubmit,
    discardChanges,
    publishChanges,
    getActionCount,
  } = useRelationMatrixEditMode();

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
      <button type='button' onClick={() => discardChanges()}>
        discard
      </button>
      <button type='button' onClick={() => void publishChanges('关系更新')}>
        publish
      </button>
      <button
        type='button'
        onClick={() => void publishChanges('关系更新', { submitMode: 'force_public_pending' })}
      >
        publish-force-public-pending
      </button>
      <button
        type='button'
        onClick={() => void publishChanges('关系更新', { submitMode: 'force_pending' })}
      >
        publish-force-pending
      </button>
    </div>
  );
}

const renderProbe = () => render(<RelationEditModeProbe />);

describe('useRelationMatrixEditMode', () => {
  let characterSnapshot: Record<string, unknown>;

  beforeEach(() => {
    characterSnapshot = structuredClone(characters) as Record<string, unknown>;
    mockPermissionProfile = 'contributor';
    window.localStorage.clear();
    mockInfo.mockClear();
    mockSuccess.mockClear();
    mockError.mockClear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    Object.keys(characters).forEach((key) => {
      delete (characters as Record<string, unknown>)[key];
    });
    Object.entries(characterSnapshot).forEach(([key, value]) => {
      (characters as Record<string, unknown>)[key] = value;
    });
    window.localStorage.clear();
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        expect(mockSuccess).toHaveBeenCalledWith(expectedToast);
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
});
