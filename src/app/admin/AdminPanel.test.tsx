import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';

import AdminPanel from './AdminPanel';

jest.mock('swr');
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

const mockSuccess = jest.fn();
const mockError = jest.fn();

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
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

describe('AdminPanel', () => {
  const mutateUsers = jest.fn();
  const mutateCategories = jest.fn();
  const mutatePendingActions = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSWR.mockImplementation((key) => {
      if (key === null) {
        return {
          data: [],
          error: undefined,
          isLoading: false,
          isValidating: false,
          mutate: mutateUsers,
        } as never;
      }

      if (key === 'categories') {
        return {
          data: [],
          error: undefined,
          isLoading: false,
          isValidating: false,
          mutate: mutateCategories,
        } as never;
      }

      if (key === 'game-data-actions-admin') {
        return {
          data: [
            {
              action_id: 'action-1',
              entity_type: 'characters',
              status: 'pending',
              created_by_nickname: 'Alice',
              created_at: '2026-04-05T08:00:00.000Z',
              reviewed_at: null,
              reviewed_by_nickname: null,
              rejection_reason: null,
              is_public: false,
              entry: {
                op: 'set',
                path: 'characters.tom',
                oldValue: 'before',
                newValue: 'after',
              },
            },
            {
              action_id: 'action-2',
              entity_type: 'characters',
              status: 'pending',
              created_by_nickname: 'Bob',
              created_at: '2026-04-05T09:00:00.000Z',
              reviewed_at: null,
              reviewed_by_nickname: null,
              rejection_reason: null,
              is_public: false,
              entry: {
                op: 'set',
                path: 'characters.jerry',
                oldValue: 'before',
                newValue: 'after',
              },
            },
          ],
          error: undefined,
          isLoading: false,
          isValidating: false,
          mutate: mutatePendingActions,
        } as never;
      }

      return {
        data: [],
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as never;
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as jest.Mock;

    window.confirm = jest.fn(() => true);
  });

  it('approves only checked pending actions during batch approval', async () => {
    render(
      <AdminPanel
        user={{
          id: 'reviewer-1',
          nickname: 'Reviewer',
          role: 'Reviewer',
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '改动审核' }));

    const bulkApproveButton = screen.getByRole('button', { name: '批量批准' });
    expect(bulkApproveButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: '选择改动 action-1' }));

    expect(bulkApproveButton).toBeEnabled();

    fireEvent.click(bulkApproveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/game-data-actions/moderation/action-1?action=approve',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/game-data-actions/moderation/action-2?action=approve',
      expect.anything()
    );
    expect(mutatePendingActions).toHaveBeenCalledTimes(1);
  });
});
