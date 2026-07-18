import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';

import ArticleHistoryClient from './ArticleHistoryClient';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockShowError = jest.fn();
let mockSearchValues: Record<string, string | null> = {};

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'article-1' }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({ get: (key: string) => mockSearchValues[key] ?? null }),
}));

jest.mock('swr', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('@/lib/auth/PermissionProvider', () => ({
  usePermissions: () => ({ has: () => false }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ success: jest.fn(), error: mockShowError }),
}));

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    preserveEditParam: _preserveEditParam,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    href: string;
    preserveEditParam?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@/components/ui/RichTextDisplay', () => ({
  __esModule: true,
  default: ({ content }: { content: string | null }) => <div>{content}</div>,
}));

jest.mock('@/features/articles/components/ArticleDiffViewer', () => ({
  __esModule: true,
  default: ({
    oldVersionNumber,
    newVersionNumber,
  }: {
    oldVersionNumber: number;
    newVersionNumber: number;
  }) => <div>{`比较版本 ${oldVersionNumber} 到 ${newVersionNumber}`}</div>,
}));

const historyData = {
  article: { id: 'article-1', title: '测试文章', categories: { name: '攻略' } },
  versions: [
    {
      id: 'v3',
      content: '<p>版本三</p>',
      created_at: '2026-01-03T00:00:00Z',
      editor_id: 'user-3',
      status: 'approved',
      commit_message: '第三版',
      users: { nickname: '编辑三' },
    },
    {
      id: 'v2',
      content: '<p>版本二</p>',
      created_at: '2026-01-02T00:00:00Z',
      editor_id: 'user-2',
      status: 'approved',
      commit_message: null,
      users: { nickname: '编辑二' },
    },
    {
      id: 'v1',
      content: '<p>版本一</p>',
      created_at: '2026-01-01T00:00:00Z',
      editor_id: 'user-1',
      status: 'approved',
      commit_message: null,
      users: { nickname: '编辑一' },
    },
  ],
  total_count: 3,
};

describe('ArticleHistoryClient diff selection', () => {
  beforeEach(() => {
    mockSearchValues = {};
    jest.mocked(useSWR).mockReturnValue({
      data: historyData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    });
  });

  it('defaults to the latest two revisions and navigates to a shareable comparison', async () => {
    render(<ArticleHistoryClient />);

    const oldVersion = screen.getByRole('radio', { name: '选择版本 #2 作为旧版本' });
    const newVersion = screen.getByRole('radio', { name: '选择版本 #3 作为新版本' });
    await waitFor(() => expect(oldVersion).toBeChecked());
    expect(newVersion).toBeChecked();
    expect(screen.getByRole('radio', { name: '选择版本 #3 作为旧版本' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: '选择版本 #1 作为新版本' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '比较选中的版本' }));
    expect(mockPush).toHaveBeenCalledWith('/articles/article-1/history?oldid=v2&diff=v3');
  });

  it('renders a valid deep-linked comparison in chronological order', () => {
    mockSearchValues = { oldid: 'v1', diff: 'v2' };
    render(<ArticleHistoryClient />);

    expect(screen.getByText('比较版本 1 到 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '版本差异' })).toBeInTheDocument();
  });

  it('rejects missing or reversed comparison IDs and returns to history', async () => {
    mockSearchValues = { oldid: 'v3', diff: 'v1' };
    render(<ArticleHistoryClient />);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('无法比较所选版本，请重新选择两个有效的历史版本');
    });
    expect(mockReplace).toHaveBeenCalledWith('/articles/article-1/history');
  });
});
