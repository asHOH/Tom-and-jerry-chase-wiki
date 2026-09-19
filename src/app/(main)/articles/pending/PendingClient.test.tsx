import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';

import { ARTICLE_CACHE_REFRESH_WARNING } from '@/constants/articles';

import PendingClient from './PendingClient';

jest.mock('swr', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/lib/auth/PermissionProvider', () => ({
  usePermissions: () => ({ has: () => true }),
}));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock('@/components/ui/RichTextDisplay', () => ({
  __esModule: true,
  default: () => <div>文章内容</div>,
}));

const mutate = jest.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  global.fetch = jest.fn();
  mutate.mockReset().mockResolvedValue(undefined);
  jest.mocked(useSWR).mockReturnValue({
    data: {
      submissions: [
        {
          id: 'v',
          version_id: 'v',
          article_id: 'a',
          article_title: '文章',
          editor_id: 'editor',
          editor_nickname: '编辑',
          status: 'pending',
          content: '内容',
          created_at: '2026-09-19T00:00:00Z',
        },
      ],
      count: 1,
    },
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate,
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

it('reports approved plus failed thanks, still refreshing the queue without repeating moderation', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
    .mockRejectedValueOnce(new Error('network unavailable'));
  render(<PendingClient />);
  fireEvent.click(screen.getByRole('button', { name: '批准并感谢' }));
  fireEvent.click(screen.getByRole('button', { name: '批准并发送感谢' }));
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('已成功批准此提交\n感谢发送失败: network unavailable')
    )
  );
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(
    jest.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/api/moderation/'))
  ).toHaveLength(1);
});

it('retains approval and cache warnings when refreshing the queue fails', async () => {
  jest.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ warning: 'cache_refresh_failed' }),
  } as Response);
  mutate.mockRejectedValueOnce(new Error('refresh unavailable'));
  render(<PendingClient />);
  fireEvent.click(screen.getByRole('button', { name: '批准' }));
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      `已成功批准此提交\n${ARTICLE_CACHE_REFRESH_WARNING}\n审核列表刷新失败，请刷新页面查看最新状态，无需重复审核。`
    )
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});
