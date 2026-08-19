import { render, screen } from '@testing-library/react';
import useSWR from 'swr';

import NotificationSettings from '@/features/settings/components/NotificationSettings';

jest.mock('swr');

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

const createSWRResponse = <T,>(data: T) =>
  ({
    data,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  }) as never;

describe('NotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSWR.mockImplementation((key) => {
      if (key === '/api/notifications/preferences') {
        return createSWRResponse({
          articleVersionPendingEnabled: false,
          gameDataActionPendingEnabled: true,
          discussionCommentEnabled: false,
          availability: {
            articleVersionPendingAvailable: false,
            gameDataActionPendingAvailable: true,
            discussionCommentAvailable: true,
          },
        });
      }

      if (key === '/api/notifications/email') {
        return createSWRResponse({
          email: null,
          enabled: false,
          verifiedAt: null,
          pendingEmail: null,
          verificationExpiresAt: null,
        });
      }

      return createSWRResponse(null);
    });
  });

  it('renders notification toggles and explanatory copy', () => {
    render(<NotificationSettings />);

    expect(screen.getByText('非文章讨论区新评论')).toBeInTheDocument();
    expect(
      screen.getByText(
        '接收非文章讨论页的新评论站内通知，不包含文章评论；您自己文章的评论通知仍会照常发送。仅站内通知，不发送邮件。'
      )
    ).toBeInTheDocument();
  });

  it('disables moderator-only toggles for ineligible users', () => {
    render(<NotificationSettings />);

    expect(screen.getByRole('checkbox', { name: /^新待审核文章/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /^新待审核游戏数据改动/ })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: /^新待审核游戏数据改动/ })).toBeChecked();
  });
});
