import { act, renderHook, waitFor } from '@testing-library/react';

import { useContributionSubmissionFeedback } from './useContributionSubmissionFeedback';

const mockPush = jest.fn();
const mockSuccess = jest.fn();
const mockSuccessWithAction = jest.fn();
const mockGetSession = jest.fn();
let mockNickname: string | null = '贡献者';
let mockHasSupabasePublicConfig = true;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({ nickname: mockNickname }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    success: mockSuccess,
    successWithAction: mockSuccessWithAction,
  }),
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

jest.mock('@/lib/supabase/config', () => ({
  hasSupabasePublicConfig: () => mockHasSupabasePublicConfig,
}));

describe('useContributionSubmissionFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNickname = '贡献者';
    mockHasSupabasePublicConfig = true;
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('offers the contributions page without changing the caller current-page behavior', () => {
    const { result } = renderHook(() => useContributionSubmissionFeedback());

    act(() => result.current('改动已提交，等待审核'));

    expect(mockSuccessWithAction).toHaveBeenCalledWith(
      '改动已提交，等待审核',
      '查看我的贡献',
      expect.any(Function),
      8000
    );
    expect(mockPush).not.toHaveBeenCalled();

    const action = mockSuccessWithAction.mock.calls[0]?.[2] as (() => void) | undefined;
    act(() => action?.());

    expect(mockPush).toHaveBeenCalledWith('/contributions/');
  });

  it('uses the authenticated session when profile data is temporarily unavailable', async () => {
    mockNickname = null;
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'authenticated-user' } } },
    });
    const { result } = renderHook(() => useContributionSubmissionFeedback());

    act(() => result.current('改动已提交，等待审核'));

    await waitFor(() => {
      expect(mockSuccessWithAction).toHaveBeenCalledWith(
        '改动已提交，等待审核',
        '查看我的贡献',
        expect.any(Function),
        8000
      );
    });
  });

  it('explains the login benefit for anonymous submissions', async () => {
    mockNickname = null;
    const { result } = renderHook(() => useContributionSubmissionFeedback());

    act(() => result.current('改动已提交，等待审核'));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith(
        '改动已提交，等待审核 登录后可查看进度并收到审核反馈。',
        8000
      );
      expect(mockSuccessWithAction).not.toHaveBeenCalled();
    });
  });
});
