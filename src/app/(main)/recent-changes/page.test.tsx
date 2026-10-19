import type { AnchorHTMLAttributes } from 'react';
import { render, screen, within } from '@testing-library/react';

import {
  getRecentChanges,
  normalizeRecentChangesFilter,
  normalizeRecentChangesPage,
} from '@/lib/recentChanges';

import RecentChangesPage from './page';

jest.mock('@/lib/recentChanges', () => ({
  getRecentChanges: jest.fn(),
  normalizeRecentChangesFilter: jest.fn(),
  normalizeRecentChangesPage: jest.fn(),
}));

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

beforeEach(() => {
  jest.mocked(normalizeRecentChangesFilter).mockReturnValue('articles');
});

it('keeps the selected filter and preserves it in pagination URLs', async () => {
  jest.mocked(normalizeRecentChangesPage).mockReturnValue(2);
  jest.mocked(getRecentChanges).mockResolvedValue({
    changes: [],
    currentPage: 2,
    totalItems: 60,
    totalPages: 3,
  });
  render(
    await RecentChangesPage({ searchParams: Promise.resolve({ type: 'articles', page: '2' }) })
  );

  const filters = within(screen.getByRole('navigation', { name: '更改类型筛选' }));
  expect(filters.getByRole('link', { name: '文章' })).toHaveAttribute('aria-current', 'page');
  expect(filters.getByRole('link', { name: '全部' })).toHaveAttribute('href', '/recent-changes');
  expect(filters.getByRole('link', { name: '游戏数据' })).toHaveAttribute(
    'href',
    '/recent-changes?type=game-data'
  );
  const pagination = within(screen.getByRole('navigation', { name: '最近更改分页' }));
  expect(pagination.getByRole('link', { name: '上一页' })).toHaveAttribute(
    'href',
    '/recent-changes?type=articles'
  );
  expect(pagination.getByRole('link', { name: '下一页' })).toHaveAttribute(
    'href',
    '/recent-changes?type=articles&page=3'
  );
});

it.each([
  [1, '上一页'],
  [3, '下一页'],
])('keeps the endpoint on page %i non-interactive', async (currentPage, label) => {
  jest.mocked(normalizeRecentChangesPage).mockReturnValue(currentPage);
  jest.mocked(getRecentChanges).mockResolvedValue({
    changes: [],
    currentPage,
    totalItems: 60,
    totalPages: 3,
  });
  render(
    await RecentChangesPage({
      searchParams: Promise.resolve({ type: 'articles', page: String(currentPage) }),
    })
  );

  const pagination = within(screen.getByRole('navigation', { name: '最近更改分页' }));
  expect(pagination.queryByRole('link', { name: label })).not.toBeInTheDocument();
  expect(pagination.getByText(label)).toHaveAttribute('aria-disabled', 'true');
});
