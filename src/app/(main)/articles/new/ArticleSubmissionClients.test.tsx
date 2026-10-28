import type { ComponentProps, ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ArticleEditInfoResponse } from '@/lib/articles/editSources';
import { ARTICLE_CACHE_REFRESH_WARNING } from '@/constants/articles';
import type ArticleForm from '@/components/articles/ArticleForm';

import EditArticleClient from '../[id]/edit/EditArticleClient';
import NewArticleClient from './NewArticleClient';

jest.mock('@/lib/supabase/browserClient', () => ({
  getOptionalSupabaseBrowserClient: () => ({
    auth: { getSession: async () => ({ data: { session: { user: { id: 'author' } } } }) },
  }),
  requireSupabaseBrowserClient: () => ({
    auth: { getSession: async () => ({ data: { session: { user: { id: 'author' } } } }) },
  }),
}));

const mockPush = jest.fn();
const mockFeedback = jest.fn();
const mockError = jest.fn();
const mockWarning = jest.fn();
const mockClearCache = jest.fn();
let mockRequiresCharacter = false;
let mockSave: ComponentProps<typeof ArticleForm>['onSave'];
const defaultInfo: ArticleEditInfoResponse = {
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

let mockInfo = defaultInfo;
let mockFormProps: ComponentProps<typeof ArticleForm>;

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
  useUser: () => ({ nickname: 'Author', isLoading: false, isValidating: false }),
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
    mockFormProps = props;
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
  sessionStorage.clear();
  mockRequiresCharacter = false;
  mockInfo = defaultInfo;
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
    jest.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
    } as Response);
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

  it('releases a lost validation failure so a corrected draft can be submitted', async () => {
    jest
      .mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Response lost'))
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request body', code: 'invalid_article_body' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
    submit();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '重试原始提交' })).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'Corrected title' } });
    fireEvent.click(screen.getByRole('button', { name: '重试原始提交' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '重试原始提交' })).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const calls = jest.mocked(fetch).mock.calls;
    expect(calls[1]![1]).toEqual(calls[0]![1]);
    expect(calls[2]![1]!.headers).not.toEqual(calls[0]![1]!.headers);
    expect(JSON.parse(calls[2]![1]!.body as string).title).toBe('Corrected title');
  });

  it('preserves the draft when the author explicitly releases a checked failed submission', async () => {
    jest.mocked(fetch).mockRejectedValueOnce(new TypeError('Lost'));
    submit();
    await waitFor(() => expect(screen.getByText('核对后解除重试')).toBeInTheDocument());
    expect(screen.getByText('查看贡献记录')).toHaveAttribute(
      'href',
      '/users/Author?tab=submissions'
    );
    fireEvent.click(screen.getByText('核对后解除重试'));
    fireEvent.click(screen.getByText('继续核对'));
    expect(sessionStorage.length).toBe(1);
    fireEvent.click(screen.getByText('核对后解除重试'));
    fireEvent.click(screen.getByText('已确认原提交失败'));
    expect(screen.getByLabelText('标题')).toHaveValue(' 新标题 ');
    expect(sessionStorage.length).toBe(0);
    expect(screen.queryByText('重试原始提交')).not.toBeInTheDocument();
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
    expect(mockClearCache).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '重试原始提交' })).toBeInTheDocument();
    expect(mockError).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('includes a browser cache failure warning and continues after saving', async () => {
    jest.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
    } as Response);
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
      jest.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
      submit();
      await waitFor(() => expect(mockFeedback).toHaveBeenCalled());
      expect(fetch).toHaveBeenCalledWith(
        mode === 'create' ? '/api/articles/submit' : '/api/articles/a/edit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': expect.any(String) },
          body: JSON.stringify({
            title: '新标题',
            category: 'c',
            content: '<p>新内容</p>',
            ...(required && { character_id: '汤姆' }),
            ...(mode === 'edit' && {
              commit_message: '更新攻略',
              base_version_id: 'old',
              pending_version_id: null,
              source_pending_version_id: null,
            }),
          }),
        }
      );
    }
  );

  it('preserves content typed during a failed submission for the next attempt', async () => {
    let finish!: (response: Response) => void;
    jest.mocked(fetch).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    fillForm();
    fireEvent.click(screen.getByText('提交'));
    act(() => mockFormProps.onContentChange('<p>请求期间新增内容</p>'));
    expect(mockFormProps.content).toBe('<p>请求期间新增内容</p>');
    await act(async () => {
      finish({ ok: false, status: 400, json: async () => ({ error: '写入失败' }) } as Response);
    });
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
    } as Response);
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(jest.mocked(fetch).mock.calls[1]![1]!.body as string).content).toBe(
      '<p>请求期间新增内容</p>'
    );
  });

  it('reuses the request key after a lost response', async () => {
    jest
      .mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Response lost'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
    fillForm();
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(mockError).toHaveBeenCalled());
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(mockFeedback).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(jest.mocked(fetch).mock.calls[1]![1]).toEqual(jest.mocked(fetch).mock.calls[0]![1]);
  });

  it('keeps uncertain content changes from starting a second write', async () => {
    jest.mocked(fetch).mockRejectedValueOnce(new TypeError('Response lost'));
    fillForm();
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(mockError).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'Changed after timeout' } });
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() =>
      expect(mockError).toHaveBeenLastCalledWith(expect.stringContaining('上次提交结果尚未确认'))
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('标题')).toHaveValue('Changed after timeout');
  });

  it('recovers the frozen request while preserving newer draft text', async () => {
    jest
      .mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Response lost'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
    fillForm();
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(mockError).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'Keep this newer draft' } });
    fireEvent.click(screen.getByRole('button', { name: '重试原始提交' }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: '打开已提交文章继续编辑' })).toBeInTheDocument()
    );
    expect(screen.getByLabelText('标题')).toHaveValue('Keep this newer draft');
    expect(jest.mocked(fetch).mock.calls[1]![1]).toEqual(jest.mocked(fetch).mock.calls[0]![1]);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it.each(['lost', 'malformed'] as const)(
    'recovers a saved %s response after reopening the editor',
    async (failure) => {
      if (failure === 'lost') jest.mocked(fetch).mockRejectedValueOnce(new TypeError('Lost'));
      else
        jest.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new SyntaxError('Bad body');
          },
        } as unknown as Response);
      const view = render(<Client characterOptions={[]} />);
      fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'Original' } });
      fireEvent.click(screen.getByText('选择分类'));
      fireEvent.click(screen.getByText('填写内容'));
      if (mode === 'edit')
        fireEvent.change(screen.getByLabelText('提交说明'), { target: { value: 'Edit' } });
      fireEvent.click(screen.getByText('提交'));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: '重试原始提交' })).toBeInTheDocument()
      );
      view.unmount();
      render(<Client characterOptions={[]} />);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: '重试原始提交' })).toBeInTheDocument()
      );
      fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'New work' } });
      jest.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
      fireEvent.click(screen.getByRole('button', { name: '重试原始提交' }));
      await waitFor(() =>
        expect(screen.getByRole('link', { name: '打开已提交文章继续编辑' })).toBeInTheDocument()
      );
      expect(screen.getByLabelText('标题')).toHaveValue('New work');
      expect(jest.mocked(fetch).mock.calls[1]![1]).toEqual(jest.mocked(fetch).mock.calls[0]![1]);
      expect(sessionStorage.length).toBe(0);
    }
  );

  it('retains its in-memory request key when session storage is unavailable', async () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    jest
      .mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Response lost'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
    fillForm();
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(mockError).toHaveBeenCalled());
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(mockFeedback).toHaveBeenCalled());
    expect(jest.mocked(fetch).mock.calls[1]![1]).toEqual(jest.mocked(fetch).mock.calls[0]![1]);
  });

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
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(screen.getByText('提交')).toBeDisabled();

    await act(async () => {
      resolveResponse({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
    });
    expect(mockFeedback).toHaveBeenCalledTimes(1);
    expect(screen.getByText('提交')).toBeEnabled();
  });
});

describe('edit source safety', () => {
  it('preserves a conflicted draft and adopts only the exact snapshot reviewed', async () => {
    const nextInfo: ArticleEditInfoResponse = {
      ...defaultInfo,
      edit_sources: {
        ...defaultInfo.edit_sources,
        approved: {
          ...defaultInfo.edit_sources.approved!,
          version_id: 'reviewed-version',
          title: 'Reviewed title',
          content: '<p>Reviewed content</p>',
        },
      },
    };
    jest
      .mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Changed', code: 'article_edit_conflict' }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => nextInfo } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
    const view = render(<EditArticleClient characterOptions={[]} />);
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'Keep my draft' } });
    fireEvent.change(screen.getByLabelText('提交说明'), { target: { value: 'Merge changes' } });
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(screen.getByText('获取最新版本用于核对')).toBeInTheDocument());
    expect(screen.getByLabelText('标题')).toHaveValue('Keep my draft');
    fireEvent.click(screen.getByText('获取最新版本用于核对'));
    await waitFor(() => expect(screen.getByText('Reviewed content')).toBeInTheDocument());
    mockInfo = {
      ...nextInfo,
      edit_sources: {
        ...nextInfo.edit_sources,
        approved: { ...nextInfo.edit_sources.approved!, version_id: 'unreviewed-newer-version' },
      },
    };
    view.rerender(<EditArticleClient characterOptions={[]} />);
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'Manually merged draft' } });
    fireEvent.click(screen.getByText('已核对并合并，保留草稿更新编辑起点'));
    fireEvent.click(screen.getByText('提交'));
    await waitFor(() => expect(mockFeedback).toHaveBeenCalled());
    expect(JSON.parse(jest.mocked(fetch).mock.calls[2]![1]!.body as string)).toMatchObject({
      title: 'Manually merged draft',
      base_version_id: 'reviewed-version',
      source_pending_version_id: null,
    });
    expect(jest.mocked(fetch).mock.calls[2]![1]!.headers).not.toEqual(
      jest.mocked(fetch).mock.calls[0]![1]!.headers
    );
  });
  const renderEditor = () => {
    mockInfo = {
      ...defaultInfo,
      edit_sources: {
        ...defaultInfo.edit_sources,
        pending_mine: {
          ...defaultInfo.edit_sources.approved!,
          version_id: 'pending',
          base_version_id: 'old',
          base_version_known: true,
          title: '待审核标题',
          content: '<p>待审核内容</p>',
        },
      },
      policy: {
        default_source: 'pending_mine',
        show_source_picker: true,
        will_override_pending: true,
      },
    };
    return render(<EditArticleClient characterOptions={[]} />);
  };

  it('keeps all local fields when the selected source is clicked', () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '正在写的标题' } });
    fireEvent.click(screen.getByText('填写内容'));
    fireEvent.change(screen.getByLabelText('提交说明'), { target: { value: '我的说明' } });
    fireEvent.click(screen.getByRole('button', { name: /我的待审核版本/ }));
    expect(mockFormProps.title).toBe('正在写的标题');
    expect(mockFormProps.content).toBe('<p>新内容</p>');
    expect(mockFormProps.commitMessage).toBe('我的说明');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches clean sources directly', () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: /公开版本/ }));
    expect(screen.getByLabelText('标题')).toHaveValue('旧标题');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('preserves cancelled changes and replaces them only after confirmation', async () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '正在写的标题' } });
    fireEvent.change(screen.getByLabelText('提交说明'), { target: { value: '我的说明' } });
    fireEvent.click(screen.getByRole('button', { name: /公开版本/ }));
    expect(screen.getByRole('dialog', { name: '切换编辑起点' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '继续编辑' }));
    expect(screen.getByLabelText('标题')).toHaveValue('正在写的标题');
    fireEvent.click(screen.getByRole('button', { name: /公开版本/ }));
    fireEvent.click(screen.getByRole('button', { name: '放弃修改并切换' }));
    expect(screen.getByLabelText('标题')).toHaveValue('旧标题');
    expect(mockFormProps.commitMessage).toBe('');
  });

  it('preserves the draft when fetched sources refresh', () => {
    const { rerender } = renderEditor();
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '正在写的标题' } });
    mockInfo = {
      ...mockInfo,
      edit_sources: {
        ...mockInfo.edit_sources,
        pending_mine: { ...mockInfo.edit_sources.pending_mine!, title: '服务器更新' },
      },
    };
    rerender(<EditArticleClient characterOptions={[]} />);
    expect(screen.getByLabelText('标题')).toHaveValue('正在写的标题');
  });

  it('blocks source changes while a submission is pending', async () => {
    let finish!: (response: Response) => void;
    jest.mocked(fetch).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    renderEditor();
    fireEvent.change(screen.getByLabelText('提交说明'), { target: { value: '提交说明' } });
    fireEvent.click(screen.getByText('提交'));
    expect(screen.getByRole('button', { name: /公开版本/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /公开版本/ }));
    expect(screen.getByLabelText('标题')).toHaveValue('待审核标题');
    await act(async () => {
      finish({
        ok: true,
        json: async () => ({ article_id: 'a', version_id: 'v', status: 'pending' }),
      } as Response);
    });
  });
});
