import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';

import type { BlockedUserSummary } from '@/lib/blocks/types';
import type { PendingGameDataAction } from '@/features/admin/components/GameDataActionModerationPanel';

import AdminPanel from './AdminPanel';

jest.mock('swr');

let currentSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useSearchParams: () => currentSearchParams,
}));

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;
const mockModerationPanel = jest.fn();

let currentProfile: 'contributor' | 'reviewer' | 'coordinator' | null = null;
let mockBlockSummary: BlockedUserSummary[] = [];
let permissionOverrides: ReadonlySet<string> | null = null;
const originalFetch = global.fetch;

jest.mock('@/lib/auth/PermissionProvider', () => {
  const actual = jest.requireActual('@/lib/auth/permissions');
  const fixtures = jest.requireActual('@/testUtils/permissionFixtures');
  return {
    usePermissions: () => {
      const grants = fixtures.permissionGrantsForProfile(currentProfile);
      return {
        grants,
        has: (permission: string) =>
          permissionOverrides?.has(permission) ?? actual.hasPermission(grants, permission),
        can: (permission: string, context?: unknown) =>
          actual.canAccess(grants, permission, context),
        canAll: (permission: string, contexts: unknown[]) =>
          actual.canAccessAll(grants, permission, contexts),
      };
    },
  };
});

jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({ blockSummary: mockBlockSummary }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('@/features/admin/components/CategoryManagement', () => {
  return function MockCategoryManagement() {
    return <div>Category Management</div>;
  };
});

jest.mock('@/features/admin/components/UserManagement', () => {
  return function MockUserManagement() {
    return <div>User Management</div>;
  };
});

jest.mock('@/features/admin/components/NoticeManagement', () => {
  return function MockNoticeManagement() {
    return <div>Notice Management</div>;
  };
});

jest.mock('@/features/admin/components/GameDataActionModerationPanel', () => ({
  __esModule: true,
  default: function MockGameDataActionModerationPanel(props: {
    canApproveActions?: boolean;
    canRejectActions?: boolean;
    canMarkActionsSynced?: boolean;
    canRevokeActions?: boolean;
    actionStatus?: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked' | 'all';
    onActionStatusChange?: (
      status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked' | 'all'
    ) => void;
    actionEntityType?: string | null;
    onActionEntityTypeChange?: (entityType: 'characters' | null) => void;
    actionId?: string | null;
    onActionIdChange?: (actionId: string | null) => void;
    pendingActions: PendingGameDataAction[];
    currentPage?: number;
    totalPages?: number;
    isPageLoading?: boolean;
    onFirstPage?: () => void;
    onNextPage?: () => void;
    onPreviousPage?: () => void;
    onLastPage?: () => void;
    pageKey?: string;
    mutatePendingActions: () => Promise<unknown> | unknown;
  }) {
    mockModerationPanel(props);
    return (
      <div data-testid='moderation-panel'>
        Moderation Panel
        <button onClick={() => props.onActionStatusChange?.('approved')}>加载已批准改动</button>
        <button onClick={props.onFirstPage}>首页</button>
        <button onClick={props.onPreviousPage}>上一页</button>
        <button onClick={props.onNextPage}>下一页</button>
        <button onClick={props.onLastPage}>尾页</button>
      </div>
    );
  },
}));

const samplePendingActions: PendingGameDataAction[] = [
  {
    action_id: 'action-1',
    entity_type: 'characters',
    status: 'pending',
    created_by: 'user-2',
    created_by_nickname: 'Alice',
    created_at: '2026-04-05T08:00:00.000Z',
    message: '',
    reviewed_at: '',
    reviewed_by: '',
    reviewed_by_nickname: '',
    rejection_reason: '',
    is_public: false,
  },
];

const mutateUsers = jest.fn();
const mutateCategories = jest.fn();
const mutatePendingActions = jest.fn().mockResolvedValue(undefined);

const createSWRResponse = <T,>(data: T, mutate: jest.Mock) =>
  ({
    data,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate,
  }) as never;

const renderAdminPanel = (profile: 'Contributor' | 'Reviewer' | 'Coordinator' | null) => {
  currentProfile = profile?.toLowerCase() as typeof currentProfile;
  return render(<AdminPanel />);
};

describe('AdminPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentProfile = null;
    mockBlockSummary = [];
    permissionOverrides = null;
    currentSearchParams = new URLSearchParams();

    mockUseSWR.mockImplementation((key) => {
      if (key === 'users') {
        return createSWRResponse([], mutateUsers);
      }

      if (key === 'categories') {
        return createSWRResponse([], mutateCategories);
      }

      if (Array.isArray(key) && key[0] === 'game-data-actions-admin') {
        return createSWRResponse(
          {
            submissions: samplePendingActions,
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
          },
          mutatePendingActions
        );
      }

      return createSWRResponse([], jest.fn());
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the categories tab by default for reviewers and enables moderation without user access', () => {
    renderAdminPanel('Reviewer');

    expect(screen.getByText('Category Management')).toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('moderation-panel')).not.toBeInTheDocument();
    expect(mockModerationPanel).not.toHaveBeenCalled();

    expect(mockUseSWR.mock.calls).toEqual([
      [null, expect.any(Function)],
      ['categories', expect.any(Function)],
      [null, expect.any(Function)],
      [null, expect.any(Function), { revalidateOnFocus: false }],
      [null, expect.any(Function)],
      ['admin-notices', expect.any(Function)],
    ]);
  });

  it('renders coordinator-only user management and wires the moderation panel props on tab switch', () => {
    renderAdminPanel('Coordinator');

    expect(screen.getByText('Category Management')).toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(mockUseSWR.mock.calls).toEqual([
      ['users', expect.any(Function)],
      ['categories', expect.any(Function)],
      ['permission-groups', expect.any(Function)],
      [null, expect.any(Function), { revalidateOnFocus: false }],
      [null, expect.any(Function)],
      ['admin-notices', expect.any(Function)],
    ]);

    const [usersTab, , categoriesTab, actionsTab] = screen.getAllByRole('button');

    fireEvent.click(usersTab!);
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.queryByText('Category Management')).not.toBeInTheDocument();

    fireEvent.click(categoriesTab!);
    expect(screen.getByText('Category Management')).toBeInTheDocument();

    fireEvent.click(actionsTab!);

    expect(screen.getByTestId('moderation-panel')).toBeInTheDocument();
    expect(mockModerationPanel).toHaveBeenCalled();
    expect(mockModerationPanel.mock.calls.at(-1)?.[0]).toEqual({
      canApproveActions: true,
      canRejectActions: true,
      canMarkActionsSynced: true,
      canRevokeActions: true,
      actionStatus: 'pending',
      onActionStatusChange: expect.any(Function),
      actionEntityType: null,
      onActionEntityTypeChange: expect.any(Function),
      actionId: null,
      onActionIdChange: expect.any(Function),
      pendingActions: samplePendingActions,
      currentPage: 1,
      totalPages: 1,
      isPageLoading: false,
      onFirstPage: expect.any(Function),
      onNextPage: expect.any(Function),
      onPreviousPage: expect.any(Function),
      onLastPage: expect.any(Function),
      pageKey: 'pending:::1',
      mutatePendingActions,
    });
    expect(mockUseSWR).toHaveBeenCalledWith(
      ['game-data-actions-admin', 'pending', null, null, 1],
      expect.any(Function),
      { revalidateOnFocus: false }
    );

    fireEvent.click(screen.getByRole('button', { name: '加载已批准改动' }));

    expect(mockUseSWR).toHaveBeenCalledWith(
      ['game-data-actions-admin', 'approved', null, null, 1],
      expect.any(Function),
      { revalidateOnFocus: false }
    );
  });

  it('uses the selected status in the action-list request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ submissions: [], currentPage: 0, totalPages: 0, totalCount: 0 }),
    } as Response);
    global.fetch = fetchMock;
    renderAdminPanel('Coordinator');

    fireEvent.click(screen.getByRole('button', { name: /改动审核/ }));
    fireEvent.click(screen.getByRole('button', { name: '加载已批准改动' }));

    const swrCall = [...mockUseSWR.mock.calls]
      .reverse()
      .find(
        ([key]) =>
          Array.isArray(key) && key[0] === 'game-data-actions-admin' && key[1] === 'approved'
      );
    if (!swrCall) throw new Error('Expected approved action-list SWR call');

    const fetcher = swrCall[1] as unknown as (key: readonly unknown[]) => Promise<unknown>;
    await fetcher(swrCall[0] as readonly unknown[]);

    expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/admin?status=approved&page=1');
  });

  it('navigates by page number and resets to page one when a filter changes', () => {
    mockUseSWR.mockImplementation((key) => {
      if (Array.isArray(key) && key[0] === 'game-data-actions-admin') {
        const page = key[4] as number;
        return createSWRResponse(
          {
            submissions: samplePendingActions,
            currentPage: page,
            totalPages: 4,
            totalCount: 151,
          },
          mutatePendingActions
        );
      }
      return createSWRResponse([], jest.fn());
    });
    renderAdminPanel('Coordinator');

    fireEvent.click(screen.getByRole('button', { name: /改动审核/ }));
    fireEvent.click(screen.getByRole('button', { name: '下一页' }));
    expect(mockUseSWR).toHaveBeenCalledWith(
      ['game-data-actions-admin', 'pending', null, null, 2],
      expect.any(Function),
      { revalidateOnFocus: false }
    );

    fireEvent.click(screen.getByRole('button', { name: '尾页' }));
    expect(mockUseSWR).toHaveBeenCalledWith(
      ['game-data-actions-admin', 'pending', null, null, 4],
      expect.any(Function),
      { revalidateOnFocus: false }
    );

    fireEvent.click(screen.getByRole('button', { name: '加载已批准改动' }));
    expect(mockUseSWR).toHaveBeenCalledWith(
      ['game-data-actions-admin', 'approved', null, null, 1],
      expect.any(Function),
      { revalidateOnFocus: false }
    );
  });

  it('clamps to the new last page when refreshed totals shrink', async () => {
    mockUseSWR.mockImplementation((key) => {
      if (Array.isArray(key) && key[0] === 'game-data-actions-admin') {
        const page = key[4] as number;
        return createSWRResponse(
          {
            submissions: page === 1 ? samplePendingActions : [],
            currentPage: page,
            totalPages: page === 1 ? 2 : 1,
            totalCount: 50,
          },
          mutatePendingActions
        );
      }
      return createSWRResponse([], jest.fn());
    });
    renderAdminPanel('Coordinator');

    fireEvent.click(screen.getByRole('button', { name: /改动审核/ }));
    fireEvent.click(screen.getByRole('button', { name: '下一页' }));

    expect(mockUseSWR).toHaveBeenCalledWith(
      ['game-data-actions-admin', 'pending', null, null, 2],
      expect.any(Function),
      { revalidateOnFocus: false }
    );
    await waitFor(() =>
      expect(mockModerationPanel.mock.calls.at(-1)?.[0]).toEqual(
        expect.objectContaining({ pageKey: 'pending:::1' })
      )
    );
  });

  it('uses the exact filtered pending total in the cached badge', async () => {
    mockUseSWR.mockImplementation((key) => {
      if (Array.isArray(key) && key[0] === 'game-data-actions-admin') {
        return createSWRResponse(
          {
            submissions: samplePendingActions,
            currentPage: 1,
            totalPages: 3,
            totalCount: 123,
          },
          mutatePendingActions
        );
      }
      return createSWRResponse([], jest.fn());
    });
    renderAdminPanel('Coordinator');
    const actionsTab = screen.getByRole('button', { name: /改动审核/ });

    fireEvent.click(actionsTab);

    await waitFor(() => expect(actionsTab).toHaveTextContent('123'));
  });

  it('keeps the cached pending badge after leaving the actions tab', async () => {
    renderAdminPanel('Coordinator');
    const actionsTab = screen.getByRole('button', { name: /改动审核/ });

    expect(actionsTab).not.toHaveTextContent('1');
    fireEvent.click(actionsTab);
    await waitFor(() => expect(actionsTab).toHaveTextContent('1'));

    fireEvent.click(screen.getByRole('button', { name: '分类管理' }));
    expect(actionsTab).toHaveTextContent('1');
  });

  it('enables moderation for a mark-synced-only permission grant', () => {
    permissionOverrides = new Set(['game_data_action.mark_synced']);
    renderAdminPanel(null);

    fireEvent.click(screen.getByRole('button', { name: /改动审核/ }));

    expect(screen.getByTestId('moderation-panel')).toBeInTheDocument();
    expect(mockModerationPanel.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        canApproveActions: false,
        canRejectActions: false,
        canMarkActionsSynced: true,
        canRevokeActions: false,
      })
    );
    expect(mockUseSWR).toHaveBeenCalledWith(
      ['game-data-actions-admin', 'pending', null, null, 1],
      expect.any(Function),
      { revalidateOnFocus: false }
    );
  });

  it('keeps both user management and moderation hidden for unprivileged roles', () => {
    renderAdminPanel(null);

    expect(screen.queryByText('Category Management')).not.toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('moderation-panel')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);

    expect(mockUseSWR.mock.calls).toEqual([
      [null, expect.any(Function)],
      [null, expect.any(Function)],
      [null, expect.any(Function)],
      [null, expect.any(Function), { revalidateOnFocus: false }],
      [null, expect.any(Function)],
      [null, expect.any(Function)],
    ]);
  });

  it('hides administrative abilities for a blocked reviewer', () => {
    mockBlockSummary = [
      {
        action: 'edit',
        reason: '审核期间暂停编辑权限',
        expiresAt: null,
        isAutoblock: false,
        blockId: 'block-1',
      },
    ];

    renderAdminPanel('Reviewer');

    expect(screen.queryByText('Category Management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('moderation-panel')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('opens the requested admin tab from the query string when allowed', () => {
    currentSearchParams = new URLSearchParams('tab=actions');

    renderAdminPanel('Coordinator');

    expect(screen.getByTestId('moderation-panel')).toBeInTheDocument();
    expect(mockModerationPanel).toHaveBeenCalled();
  });
});
