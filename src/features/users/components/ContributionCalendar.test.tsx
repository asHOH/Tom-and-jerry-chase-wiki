import { render, screen } from '@testing-library/react';

import { ContributionCalendar } from './ContributionCalendar';

it('displays canonical daily counts and keeps missing or invalid counts at zero', () => {
  render(
    <ContributionCalendar
      days={[
        { date: '2026-09-30', total: 5, articles: 2, gameData: 3 },
        { date: '2026-09-29', total: NaN, articles: -1, gameData: Infinity },
      ]}
      asOf='2026-10-01'
    />
  );

  expect(
    screen.getByRole('gridcell', {
      name: '2026年9月30日：5 次贡献（文章 2 次，游戏数据 3 次）',
    })
  ).toHaveClass('bg-blue-800');
  expect(
    screen.getByRole('gridcell', {
      name: '2026年10月1日：0 次贡献（文章 0 次，游戏数据 0 次）',
    })
  ).toHaveClass('bg-slate-100');
  expect(
    screen.getByRole('gridcell', {
      name: '2026年9月29日：0 次贡献（文章 0 次，游戏数据 0 次）',
    })
  ).toHaveClass('bg-slate-100');
});

it('keeps the calendar error ahead of loading and shows loading after the error clears', () => {
  const { rerender } = render(
    <ContributionCalendar days={[]} asOf='2026-10-01' hasError isLoading />
  );

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('贡献日历加载失败');
  expect(alert).toHaveTextContent('请稍后刷新页面重试。');
  expect(alert).toHaveAttribute('aria-live', 'assertive');
  expect(screen.queryByLabelText('正在加载贡献日历')).not.toBeInTheDocument();
  expect(screen.queryByRole('grid')).not.toBeInTheDocument();

  rerender(<ContributionCalendar days={[]} asOf='2026-10-01' isLoading />);

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByLabelText('正在加载贡献日历')).toHaveAttribute('aria-busy', 'true');
});
