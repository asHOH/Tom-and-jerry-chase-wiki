import type { AnchorHTMLAttributes } from 'react';
import type { Route } from 'next';
import { render, screen, within } from '@testing-library/react';

import type { ContributionActivityPage } from '@/lib/users/contributionActivity';

import { ContributionActivityHistory } from './ContributionActivityHistory';

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

const filterHrefs = {
  all: '/users/test?tab=activity',
  articles: '/users/test?tab=activity&type=articles',
  'game-data': '/users/test?tab=activity&type=game-data',
} as const;
const pageHref = (page: number) => `/users/test?tab=activity&type=articles&page=${page}` as Route;
const page: ContributionActivityPage = {
  items: [
    {
      id: 'article-edit',
      kind: 'article',
      title: '编辑文章',
      description: null,
      href: null,
      createdAt: '2026-10-01T00:00:00Z',
    },
  ],
  currentPage: 5,
  totalItems: 200,
  totalPages: 10,
};

it('keeps filter navigation available while an error takes precedence over loading and data', () => {
  render(
    <ContributionActivityHistory
      page={page}
      filter='articles'
      filterHrefs={filterHrefs}
      pageHref={pageHref}
      hasError
      isLoading
    />
  );

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('贡献历史加载失败');
  expect(alert).toHaveTextContent('请稍后刷新页面重试。');
  expect(alert).toHaveAttribute('aria-live', 'assertive');
  expect(screen.getByRole('link', { name: '全部' })).toHaveAttribute('href', filterHrefs.all);
  expect(screen.queryByLabelText('正在加载贡献记录')).not.toBeInTheDocument();
  expect(screen.queryByText('编辑文章')).not.toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: '贡献记录分页' })).not.toBeInTheDocument();
});

it('preserves filter links, page destinations, ellipses, and the current-page marker', () => {
  render(
    <ContributionActivityHistory
      page={page}
      filter='articles'
      filterHrefs={filterHrefs}
      pageHref={pageHref}
    />
  );

  const filters = within(screen.getByRole('navigation', { name: '贡献类型筛选' }));
  expect(filters.getByRole('link', { name: '文章' })).toHaveAttribute('aria-current', 'page');
  expect(filters.getByRole('link', { name: '全部' })).toHaveAttribute('href', filterHrefs.all);
  expect(filters.getByRole('link', { name: '游戏数据' })).toHaveAttribute(
    'href',
    filterHrefs['game-data']
  );
  const pagination = within(screen.getByRole('navigation', { name: '贡献记录分页' }));
  expect(pagination.getByText('5')).toHaveAttribute('aria-current', 'page');
  expect(pagination.queryByRole('link', { name: '第 5 页' })).not.toBeInTheDocument();
  expect(pagination.getAllByText('…')).toHaveLength(2);
  expect(pagination.getByRole('link', { name: '第 1 页' })).toHaveAttribute('href', pageHref(1));
  expect(pagination.getByRole('link', { name: '第 10 页' })).toHaveAttribute('href', pageHref(10));
  expect(pagination.getByRole('link', { name: '上一页' })).toHaveAttribute('href', pageHref(4));
  expect(pagination.getByRole('link', { name: '下一页' })).toHaveAttribute('href', pageHref(6));
});

it.each([
  [1, '上一页'],
  [10, '下一页'],
])('keeps the endpoint on page %i non-interactive', (currentPage, label) => {
  render(
    <ContributionActivityHistory
      page={{ ...page, currentPage }}
      filter='articles'
      filterHrefs={filterHrefs}
      pageHref={pageHref}
    />
  );

  const pagination = within(screen.getByRole('navigation', { name: '贡献记录分页' }));
  expect(pagination.queryByRole('link', { name: label })).not.toBeInTheDocument();
  expect(pagination.getByText(label)).toHaveAttribute('aria-disabled', 'true');
});
