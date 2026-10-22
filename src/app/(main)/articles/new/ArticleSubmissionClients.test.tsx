import type { ComponentProps, ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ARTICLE_CACHE_REFRESH_WARNING } from '@/constants/articles';
import type ArticleForm from '@/components/articles/ArticleForm';

import EditArticleClient from '../[id]/edit/EditArticleClient';
import NewArticleClient from './NewArticleClient';

const mockPush = jest.fn();
const mockFeedback = jest.fn();
const mockError = jest.fn();
const mockWarning = jest.fn();
const mockClearCache = jest.fn();
let mockRequiresCharacter = false;
let mockSave: ComponentProps<typeof ArticleForm>['onSave'];
const mockInfo = {
  article: { id: 'a', title: '旧标题', category_id: 'c', character_id: null, created_at: '' },
  edit_sources: {
    approved: {
      version_id: 'old',
      title: '旧标题',
      category_id: 'c',
      character_id: null,
      content: '<p>旧内容</p>',
      created_at: '',
    },
    pending_mine: null,
  },
  policy: { default_source: 'approved', show_source_picker: false, will_override_pending: false },
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'a' }),
}));
jest.mock('swr', () => ({
  __esModule: true,
  useSWRConfig: () => ({ mutate: mockClearCache }),
  default: (key: string) => ({
    data:
      key === '/api/categories'
        ? {
            categories: [{ id: 'c', name: '攻略', requires_character: mockRequiresCharacter }],
          }
        : mockInfo,
  }),
}));
jest.mock('@/lib/auth/PermissionProvider', () => ({
  usePermissions: () => ({ has: () => true, can: () => true }),
}));
jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({ isLoading: false, isValidating: false }),
}));
jest.mock('@/hooks/useContributionSubmissionFeedback', () => ({
  useContributionSubmissionFeedback: () => mockFeedback,
}));
jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ error: mockError, warning: mockWarning }),
}));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock('@/components/articles/ArticleForm', () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof ArticleForm>) => {
    mockSave = props.onSave;
    return (
      <div>
        <input
          aria-label='标题'
          value={props.title}
          onChange={(e) => props.onTitleChange(e.target.value)}
        />
        <button onClick={() => props.onCategoryChange('c')}>选择分类</button>
        <button onClick={() => props.onContentChange('<p>新内容</p>')}>填写内容</button>
        <button onClick={() => props.onCharacterChange?.('汤姆')}>选择角色</button>
        {props.onCommitMessageChange && (
          <input
            aria-label='提交说明'
            value={props.commitMessage}
            onChange={(e) => props.onCommitMessageChange?.(e.target.value)}
          />
        )}
        <button disabled={props.isSubmitting} onClick={props.onSave}>
          提交
        </button>
      </div>
    );
  },
}));

const originalFetch = global.fetch;
beforeEach(() => {
  mockRequiresCharacter = false;
  global.fetch = jest.fn();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  // jsdom cannot navigate documents; browser navigation is checked separately.
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  global.fetch = originalFetch;
});

describe.each([
  ['create', NewArticleClient],
  ['edit', EditArticleClient],
] as const)('%s feedback', (mode, Client) => {
  const fillForm = () => {
    render(<Client characterOptions={[]} />);
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: ' 新标题 ' } });
    fireEvent.click(screen.getByText('选择分类'));
    fireEvent.click(screen.getByText('填写内容'));
    if (mockRequiresCharacter) fireEvent.click(screen.getByText('选择角色'));
    if (mode === 'edit')
      fireEvent.change(screen.getByLabelText('提交说明'), { target: { value: ' 更新攻略 ' } });
  };

  const submit = () => {
    fillForm();
    fireEvent.click(screen.getByText('提交'));
  };

  it.each([
    ['approved', '提交已自动通过审核并发布。'],
    ['pending', '提交成功，正在等待审核。'],
    ['rejected', '提交已保存，但未通过自动审核。请在我的贡献中查看详情。'],
    [null, '提交已成功，但未能获取审核状态。请在我的贡献中查看，请勿重复提交。'],
  ])(
    'shows %s without duplicating the write, including a cache warning',
    async (status, message) => {
      jest.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          article_id: 'a',
          version_id: 'v',
          status,
          warning: 'cache_refresh_failed',
        }),
      } as Response);
      submit();
      await waitFor(() =>
        expect(status === 'approved' ? window.alert : mockFeedback).toHaveBeenCalledWith(
          `${message}\n${ARTICLE_CACHE_REFRESH_WARNING}`
        )
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(mockError).not.toHaveBeenCalled();
      if (status === 'approved') expect(mockPush).not.toHaveBeenCalled();
      else expect(mockPush).toHaveBeenCalledWith('/articles');
    }
  );

  it('does not describe failed success feedback as a failed write', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValue({ ok: true, json: async () => ({ status: 'pending' }) } as Response);
    mockFeedback.mockImplementationOnce(() => {
      throw new Error('feedback failed');
    });
    submit();
    await waitFor(() =>
      expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('提交已成功'), 8000)
    );
    expect(mockError).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mockClearCache).toHaveBeenCalledTimes(1);
  });

  it('shows the API error when the write fails', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValue({ ok: false, json: async () => ({ error: '写入失败' }) } as Response);
    submit();
    await waitFor(() => expect(mockError).toHaveBeenCalledWith('写入失败'));
    expect(mockFeedback).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('preserves successful writes when the response body cannot be parsed', async () => {
    jest.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Invalid JSON');
      },
    } as unknown as Response);
    submit();
    await waitFor(() =>
      expect(mockFeedback).toHaveBeenCalledWith(
        '提交已成功，但未能获取审核状态。请在我的贡献中查看，请勿重复提交。'
      )
    );
    const cacheKeyMatches = mockClearCache.mock.calls[0][0];
    expect(cacheKeyMatches('/api/articles/a/info')).toBe(mode === 'edit');
    expect(mockPush).toHaveBeenCalledWith('/articles');
    expect(mockError).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('includes a browser cache failure warning and continues after saving', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValue({ ok: true, json: async () => ({ status: 'pending' }) } as Response);
    mockClearCache.mockRejectedValueOnce(new Error('cache unavailable'));
    submit();
    await waitFor(() =>
      expect(mockFeedback).toHaveBeenCalledWith(
        '提交成功，正在等待审核。\n操作已成功，但页面数据刷新失败。请刷新页面查看最新状态，请勿重复提交。'
      )
    );
    expect(mockPush).toHaveBeenCalledWith('/articles');
    expect(mockError).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    'preserves the payload when character is required: %s',
    async (required) => {
      mockRequiresCharacter = required;
      jest
        .mocked(fetch)
        .mockResolvedValue({ ok: true, json: async () => ({ status: 'pending' }) } as Response);
      submit();
      await waitFor(() => expect(mockFeedback).toHaveBeenCalled());
      expect(fetch).toHaveBeenCalledWith(
        mode === 'create' ? '/api/articles/submit' : '/api/articles/a/edit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '新标题',
            category: 'c',
            content: '<p>新内容</p>',
            ...(required && { character_id: '汤姆' }),
            ...(mode === 'edit' && { commit_message: '更新攻略' }),
          }),
        }
      );
    }
  );

  it('sends one write for repeat submissions before the pending state renders', async () => {
    let resolveResponse!: (response: Response) => void;
    jest.mocked(fetch).mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      })
    );
    fillForm();
    act(() => {
      void mockSave();
      void mockSave();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('提交')).toBeDisabled();

    await act(async () => {
      resolveResponse({ ok: true, json: async () => ({ status: 'pending' }) } as Response);
    });
    expect(mockFeedback).toHaveBeenCalledTimes(1);
    expect(screen.getByText('提交')).toBeEnabled();
  });
});
