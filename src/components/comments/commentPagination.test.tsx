import { fireEvent, render, screen, within } from '@testing-library/react';
import { SWRConfig, type State } from 'swr';

import type { ApiComment } from '@/lib/comments/types';
import { TalkPageClient } from '@/features/discussion/TalkPageClient';

import CommentsSection from './CommentsSection';

jest.mock('@/lib/auth/PermissionProvider', () => ({ usePermissions: () => ({ can: () => true }) }));
jest.mock('@/hooks/useUser', () => ({ useUser: () => ({ nickname: '汤姆' }) }));
jest.mock('@/hooks/useMediaQuery', () => ({ useMobile: () => true }));
jest.mock('@/components/LoginDialog', () => () => null);

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

it.each(['articles', 'characters'] as const)(
  '%s can post reply 51, refresh, retry loading more and read it under the original parent',
  async (scope) => {
    const article = scope === 'articles';
    const rows: ApiComment[] = Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      parent_id: i < 2 ? null : '1',
      content: `内容 ${i}`,
      created_at: new Date(2026, 0, 1, 0, i).toISOString(),
      title: i < 2 ? `话题 ${i}` : null,
      status: 'visible',
      author: { id: 'user', nickname: '汤姆' },
    }));
    const parent = rows[0]!;
    const reply = '刷新后可见的回复';
    const cursor = `${rows[49]!.created_at}|${rows[49]!.id}`;
    let failNextPage = true;
    const fetchMock = jest.fn(async (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        const { content, parentId } = JSON.parse(String(options.body));
        rows.push({
          ...parent,
          id: '50',
          parent_id: parentId,
          content,
          title: null,
          created_at: new Date(2026, 0, 2).toISOString(),
        });
        return { ok: true, json: async () => ({ comment: rows.at(-1) }) };
      }
      const params = new URL(url, 'http://localhost').searchParams;
      expect(params.get('scope')).toBe(scope);
      expect(params.get('targetId')).toBe('汤姆');
      if (params.has('cursor')) {
        expect(params.get('cursor')).toBe(cursor);
        if (failNextPage) {
          failNextPage = false;
          return { ok: false, status: 500, json: async () => ({ error: 'load failed' }) };
        }
        return { ok: true, json: async () => ({ comments: rows.slice(50), nextCursor: null }) };
      }
      return {
        ok: true,
        json: async () => ({
          comments: rows.slice(0, 50),
          nextCursor: rows.length > 50 ? cursor : null,
        }),
      };
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    function openReader(cache = new Map<string, State>()) {
      return render(
        <SWRConfig value={{ provider: () => cache, shouldRetryOnError: false }}>
          {article ? (
            <CommentsSection scope='articles' targetId='汤姆' />
          ) : (
            <TalkPageClient
              scope={scope}
              targetId='汤姆'
              entityTitle='汤姆'
              entityTypeLabel='角色'
              parentUrl='/characters/'
            />
          )}
        </SWRConfig>
      );
    }

    function parentThread() {
      const body = screen.getByText(parent.content);
      return article ? body.parentElement! : body.closest('section')!;
    }

    const reader = openReader();
    await screen.findByText(parent.content);
    fireEvent.click(within(parentThread()).getByRole('button', { name: '回复' }));
    fireEvent.change(screen.getByPlaceholderText(article ? '写下你的评论…' : '写下你的回复…'), {
      target: { value: reply },
    });
    fireEvent.click(screen.getByRole('button', { name: article ? '发表评论' : '发表回复' }));
    await screen.findByRole('button', { name: '加载更多评论' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/comments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ scope, targetId: '汤姆', parentId: parent.id, content: reply }),
      })
    );

    reader.unmount();
    const cache = new Map<string, State>();
    const refreshed = openReader(cache);
    fireEvent.click(await screen.findByRole('button', { name: '加载更多评论' }));
    expect(screen.getByText(parent.content)).toBeVisible();
    fireEvent.click(await screen.findByRole('button', { name: '重试' }));
    expect(await within(parentThread()).findByText(reply)).toBeVisible();
    expect(screen.queryByRole('button', { name: '加载更多评论' })).toBeNull();
    if (!article) {
      const contents = within(screen.getByRole('navigation', { name: '目录' }));
      expect(contents.getAllByRole('link')[0]).toHaveTextContent(parent.title!);
      expect(within(parentThread()).getAllByRole('button', { name: '隐藏' })).toHaveLength(2);
    }

    // A reload restores both pages from local storage. Page one's cursor is still identical.
    refreshed.unmount();
    rows[50] = { ...rows[50]!, id: 'replacement', content: '另一条可见回复' };
    openReader(new Map(cache));
    expect(await within(parentThread()).findByText('另一条可见回复')).toBeVisible();
    expect(screen.queryByText(reply)).toBeNull();
  }
);
