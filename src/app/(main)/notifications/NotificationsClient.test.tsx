import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

import NotificationsClient from './NotificationsClient';

jest.mock('swr');
jest.mock('swr/infinite');

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/Link', () => {
  return function MockLink({
    children,
    href,
    onClick,
  }: {
    children: ReactNode;
    href: string;
    onClick?: () => void;
  }) {
    return (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    );
  };
});

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;
const mockUseSWRInfinite = useSWRInfinite as jest.MockedFunction<typeof useSWRInfinite>;

const createSWRResponse = <T,>(data: T) =>
  ({
    data,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  }) as never;

describe('NotificationsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSWRInfinite.mockReturnValue({
      data: [{ notifications: [], unreadCount: 0, nextCursor: null }],
      error: undefined,
      size: 1,
      setSize: jest.fn(),
      mutate: jest.fn(),
      isLoading: false,
      isValidating: false,
    } as never);

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
    render(<NotificationsClient />);

    expect(screen.getByText('非文章讨论区新评论')).toBeInTheDocument();
    expect(
      screen.getByText(
        '接收非文章讨论页的新评论站内通知，不包含文章评论；您自己文章的评论通知仍会照常发送。仅站内通知，不发送邮件。'
      )
    ).toBeInTheDocument();
  });

  it('disables moderator-only toggles for ineligible users', () => {
    render(<NotificationsClient />);

    expect(screen.getByRole('checkbox', { name: '新待审核文章' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: '新待审核游戏数据改动' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: '新待审核游戏数据改动' })).toBeChecked();
  });
});
