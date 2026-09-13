import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';

import { permissionGrantsForProfile } from '@/testUtils/permissionFixtures';

import GameDataActionModeration from './GameDataActionModeration';

jest.mock('@/lib/supabase/browserClient', () => ({
  getOptionalSupabaseBrowserClient: () => undefined,
}));
jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));

it('coordinates the real panel, list cache, activation, permissions, and count reporting', async () => {
  let totalCount = 101;
  const originalFetch = global.fetch;
  const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
    const params = new URL(String(input), 'https://www.tjwiki.com').searchParams;
    const skipCount = params.get('count') === 'none';
    return {
      ok: true,
      json: async () => ({
        submissions: [],
        currentPage: Number(params.get('page')),
        totalCount: skipCount ? null : totalCount,
        totalPages: skipCount ? null : Math.ceil(totalCount / 50),
      }),
    } as Response;
  });
  global.fetch = fetchMock;
  const cache = new Map();
  const onPendingCountChange = jest.fn();
  const permissions = {
    grants: permissionGrantsForProfile('reviewer'),
    has: () => true,
  };
  const view = (active: boolean, enabled = true) => (
    <SWRConfig value={{ provider: () => cache }}>
      <GameDataActionModeration
        permissions={permissions}
        active={active}
        enabled={enabled}
        onPendingCountChange={onPendingCountChange}
      />
    </SWRConfig>
  );
  try {
    const { rerender } = render(view(true));
    await waitFor(() => expect(onPendingCountChange).toHaveBeenLastCalledWith(101));
    fireEvent.click(screen.getByRole('button', { name: '尾页' }));
    await screen.findByText('第 3 / 3 页');

    fireEvent.change(screen.getByTitle('过滤实体类型'), { target: { value: 'characters' } });
    await screen.findByText('第 1 / 3 页');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/game-data-actions/admin?status=pending&page=1&entityType=characters'
    );
    fireEvent.click(screen.getByRole('button', { name: '尾页' }));
    await screen.findByText('第 3 / 3 页');

    const requestsBeforeSwitch = fetchMock.mock.calls.length;
    rerender(view(false));
    expect(screen.queryByTitle('过滤状态')).not.toBeInTheDocument();
    rerender(view(true));
    await screen.findByText('第 3 / 3 页');
    expect(screen.getByTitle('过滤实体类型')).toHaveValue('characters');
    expect(fetchMock).toHaveBeenCalledTimes(requestsBeforeSwitch);

    totalCount = 1;
    fireEvent.click(screen.getByRole('button', { name: '刷新' }));
    await screen.findByText('第 1 / 1 页');
    expect(onPendingCountChange).toHaveBeenLastCalledWith(null);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/game-data-actions/admin?status=pending&page=3&entityType=characters'
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/game-data-actions/admin?status=pending&page=1&entityType=characters&count=none'
    );

    fireEvent.change(screen.getByTitle('过滤实体类型'), { target: { value: 'all' } });
    await waitFor(() => expect(onPendingCountChange).toHaveBeenLastCalledWith(1));
    fireEvent.change(screen.getByTitle('过滤状态'), { target: { value: 'approved' } });
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/game-data-actions/admin?status=approved&page=1'
      )
    );
    await screen.findByText('第 1 / 1 页');

    rerender(view(false, false));
    await waitFor(() => expect(onPendingCountChange).toHaveBeenLastCalledWith(null));
    const requestsWithoutAccess = fetchMock.mock.calls.length;
    rerender(view(true, false));
    expect(screen.queryByTitle('过滤状态')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(requestsWithoutAccess);
    rerender(view(true));
    await screen.findByText('第 1 / 1 页');
    expect(screen.getByTitle('过滤状态')).toHaveValue('approved');
    expect(fetchMock).toHaveBeenCalledTimes(requestsWithoutAccess + 1);
  } finally {
    global.fetch = originalFetch;
  }
});
