import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import type { ArticleListParams } from '@/lib/articles/listParams';
import type { ArticleListPageData } from '@/data/types';

import ArticlesClient from './ArticlesClient';

const mockReplace = jest.fn();
const mockInfo = jest.fn();
let mockSwipeOptions: { onSwipeLeft: () => void; onSwipeRight: () => void } | null = null;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('motion/react', () => ({
  m: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
  useReducedMotion: () => true,
}));

jest.mock('react-plock', () => ({
  Masonry: ({
    items,
    render: renderItem,
  }: {
    items: ArticleListPageData['articles'];
    render: (article: ArticleListPageData['articles'][number]) => ReactNode;
  }) => <>{items.map(renderItem)}</>,
}));

jest.mock('@/lib/auth/PermissionProvider', () => ({
  usePermissions: () => ({ has: () => false }),
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: () => false,
}));

jest.mock('@/hooks/useSwipeGesture', () => ({
  useSwipeGesture: (options: typeof mockSwipeOptions) => {
    mockSwipeOptions = options;
    return { current: null };
  },
}));

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({ isEditMode: false }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ info: mockInfo }),
}));

jest.mock('../hooks/useArticleListScrollRestoration', () => ({
  useArticleListScrollRestoration: jest.fn(),
}));

jest.mock('@/components/ui/PageHeader', () => ({
  __esModule: true,
  default: ({ children, title }: { children?: ReactNode; title: string }) => (
    <header>
      <h1>{title}</h1>
      {children}
    </header>
  ),
}));

jest.mock('@/components/ui/EntityCardFrame', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <article>{children}</article>,
}));

jest.mock('@/components/ui/ButtonLink', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));

jest.mock('./ArticleFilters', () => ({
  __esModule: true,
  default: ({
    handleCategoryToggle,
    handleClearFilters,
    handleSortChange,
  }: {
    handleCategoryToggle: (categoryId: string) => void;
    handleClearFilters: () => void;
    handleSortChange: (sortBy: 'title', sortOrder: 'asc') => void;
  }) => (
    <div>
      <button onClick={() => handleCategoryToggle(mockCategoryB)}>切换分类</button>
      <button onClick={handleClearFilters}>清除分类</button>
      <button onClick={() => handleSortChange('title', 'asc')}>标题排序</button>
    </div>
  ),
}));

jest.mock('./ArticlePagination', () => ({
  __esModule: true,
  default: ({ handlePageChange }: { handlePageChange: (page: number) => void }) => (
    <button onClick={() => handlePageChange(2)}>第二页</button>
  ),
}));

const mockCategoryA = '11111111-1111-1111-1111-111111111111';
const mockCategoryB = '22222222-2222-2222-2222-222222222222';

const listParams: ArticleListParams = {
  page: 1,
  categoryIds: [mockCategoryA],
  sortBy: 'created_at',
  sortOrder: 'desc',
};

const pageData: ArticleListPageData = {
  articles: [
    {
      id: 'article-1',
      title: '文章一',
      created_at: '2026-08-01T00:00:00.000Z',
      author_id: 'author-1',
      category_id: mockCategoryA,
      view_count: 3,
      categories: { id: mockCategoryA, name: '攻略' },
      users_public_view: { nickname: '作者' },
      current_version: {
        id: 'version-1',
        excerpt: '这是服务端生成的摘要',
        created_at: '2026-08-02T00:00:00.000Z',
        status: 'approved',
        editor_id: null,
        users_public_view: null,
      },
    },
  ],
  categories: [
    { id: mockCategoryA, name: '攻略' },
    { id: mockCategoryB, name: '资讯' },
  ],
  total_count: 25,
  current_page: 1,
  total_pages: 2,
  has_next: true,
  has_prev: false,
};

describe('ArticlesClient server-driven navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSwipeOptions = null;
  });

  it('renders only the supplied page and its excerpt', () => {
    render(<ArticlesClient articles={pageData} listParams={listParams} characterSummaries={{}} />);

    expect(screen.getByText('共 25 篇文章')).toBeInTheDocument();
    expect(screen.getByText('文章一')).toBeInTheDocument();
    expect(screen.getByText('这是服务端生成的摘要')).toBeInTheDocument();
  });

  it('navigates with canonical server filter, sort, and page parameters', () => {
    render(<ArticlesClient articles={pageData} listParams={listParams} characterSummaries={{}} />);

    fireEvent.click(screen.getByRole('button', { name: '切换分类' }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      `/articles?category=${mockCategoryA}%2C${mockCategoryB}`,
      { scroll: false }
    );

    fireEvent.click(screen.getByRole('button', { name: '标题排序' }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      `/articles?category=${mockCategoryA}&sort=title&order=asc`,
      { scroll: false }
    );

    fireEvent.click(screen.getByRole('button', { name: '第二页' }));
    expect(mockReplace).toHaveBeenLastCalledWith(`/articles?page=2&category=${mockCategoryA}`, {
      scroll: false,
    });
  });

  it('preserves keyboard, swipe, and clear-filter navigation', () => {
    render(<ArticlesClient articles={pageData} listParams={listParams} characterSummaries={{}} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockReplace).toHaveBeenLastCalledWith(`/articles?page=2&category=${mockCategoryA}`, {
      scroll: false,
    });

    mockSwipeOptions?.onSwipeLeft();
    expect(mockReplace).toHaveBeenLastCalledWith(`/articles?page=2&category=${mockCategoryA}`, {
      scroll: false,
    });

    fireEvent.click(screen.getByRole('button', { name: '清除分类' }));
    expect(mockReplace).toHaveBeenLastCalledWith('/articles', { scroll: false });
    expect(mockInfo).toHaveBeenCalledWith('已清除所有筛选条件');
  });
});
