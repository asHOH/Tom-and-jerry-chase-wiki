import { fireEvent, render, screen } from '@testing-library/react';
import useSWR from 'swr';

import type { PendingGameDataAction } from '@/features/admin/components/GameDataActionModerationPanel';

import AdminPanel from './AdminPanel';

jest.mock('swr');

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;
const mockModerationPanel = jest.fn();

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

jest.mock('@/features/admin/components/GameDataActionModerationPanel', () => ({
  __esModule: true,
  default: function MockGameDataActionModerationPanel(props: {
    pendingActions: PendingGameDataAction[];
    mutatePendingActions: () => Promise<unknown> | unknown;
  }) {
    mockModerationPanel(props);
    return <div data-testid='moderation-panel'>Moderation Panel</div>;
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
    entry: {
      op: 'set',
      path: 'characters.tom',
      oldValue: 'before',
      newValue: 'after',
    },
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

const renderAdminPanel = (role: string | null) =>
  render(
    <AdminPanel
      user={{
        id: 'user-1',
        nickname: 'Tester',
        role,
      }}
    />
  );

describe('AdminPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSWR.mockImplementation((key) => {
      if (key === 'users') {
        return createSWRResponse([], mutateUsers);
      }

      if (key === 'categories') {
        return createSWRResponse([], mutateCategories);
      }

      if (key === 'game-data-actions-admin') {
        return createSWRResponse(samplePendingActions, mutatePendingActions);
      }

      return createSWRResponse([], jest.fn());
    });
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
      ['game-data-actions-admin', expect.any(Function)],
    ]);
  });

  it('renders coordinator-only user management and wires the moderation panel props on tab switch', () => {
    renderAdminPanel('Coordinator');

    expect(screen.getByText('Category Management')).toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(mockUseSWR.mock.calls).toEqual([
      ['users', expect.any(Function)],
      ['categories', expect.any(Function)],
      ['game-data-actions-admin', expect.any(Function)],
    ]);

    const [usersTab, categoriesTab, actionsTab] = screen.getAllByRole('button');

    fireEvent.click(usersTab!);
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.queryByText('Category Management')).not.toBeInTheDocument();

    fireEvent.click(categoriesTab!);
    expect(screen.getByText('Category Management')).toBeInTheDocument();

    fireEvent.click(actionsTab!);

    expect(screen.getByTestId('moderation-panel')).toBeInTheDocument();
    expect(mockModerationPanel).toHaveBeenCalledTimes(1);
    expect(mockModerationPanel.mock.calls[0]?.[0]).toEqual({
      pendingActions: samplePendingActions,
      mutatePendingActions,
    });
  });

  it('keeps both user management and moderation hidden for unprivileged roles', () => {
    renderAdminPanel(null);

    expect(screen.getByText('Category Management')).toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('moderation-panel')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);

    expect(mockUseSWR.mock.calls).toEqual([
      [null, expect.any(Function)],
      ['categories', expect.any(Function)],
      [null, expect.any(Function)],
    ]);
  });
});
