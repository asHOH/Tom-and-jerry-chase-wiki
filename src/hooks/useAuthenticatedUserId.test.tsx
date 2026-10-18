import { act, renderHook, waitFor } from '@testing-library/react';

import { getOptionalSupabaseBrowserClient } from '@/lib/supabase/browserClient';

import { useAuthenticatedUserId } from './useAuthenticatedUserId';

const mockGetClaims = jest.fn();
const mockUnsubscribe = jest.fn();
let authChange: (event: string, session: { user: { id: string } } | null) => void;
jest.mock('@/lib/supabase/browserClient', () => ({ getOptionalSupabaseBrowserClient: jest.fn() }));

beforeEach(() => {
  mockGetClaims.mockResolvedValue({ data: { claims: { sub: 'account-a' } } });
  jest.mocked(getOptionalSupabaseBrowserClient).mockReturnValue({
    auth: {
      getClaims: mockGetClaims,
      onAuthStateChange: (callback: typeof authChange) => {
        authChange = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    },
  } as unknown as ReturnType<typeof getOptionalSupabaseBrowserClient>);
});

it('hides identity until verified, then immediately clears it on logout', async () => {
  const { result, unmount } = renderHook(() => useAuthenticatedUserId());
  expect(result.current).toEqual({ userId: null, isLoading: true });
  await waitFor(() => expect(result.current.userId).toBe('account-a'));
  act(() => authChange('SIGNED_OUT', null));
  expect(result.current).toEqual({ userId: null, isLoading: false });
  unmount();
  expect(mockUnsubscribe).toHaveBeenCalled();
});

it('preserves the same account during token refresh and clears it during account switching', async () => {
  const { result } = renderHook(() => useAuthenticatedUserId());
  await waitFor(() => expect(result.current.userId).toBe('account-a'));
  act(() => authChange('TOKEN_REFRESHED', { user: { id: 'account-a' } }));
  expect(result.current.userId).toBe('account-a');
  mockGetClaims.mockResolvedValueOnce({ data: { claims: { sub: 'account-b' } } });
  act(() => authChange('SIGNED_IN', { user: { id: 'account-b' } }));
  expect(result.current.userId).toBeNull();
  await waitFor(() => expect(result.current.userId).toBe('account-b'));
});

it('does not restore an old in-flight identity after logout', async () => {
  let resolveClaims!: (value: unknown) => void;
  mockGetClaims.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveClaims = resolve;
    })
  );
  const { result } = renderHook(() => useAuthenticatedUserId());
  act(() => authChange('SIGNED_OUT', null));
  await act(async () => {
    resolveClaims({ data: { claims: { sub: 'account-a' } } });
  });
  expect(result.current.userId).toBeNull();
});

it('fails closed when authentication is unavailable', async () => {
  jest.mocked(getOptionalSupabaseBrowserClient).mockReturnValueOnce(undefined);
  const { result } = renderHook(() => useAuthenticatedUserId());
  expect(result.current).toEqual({ userId: null, isLoading: false });
});
