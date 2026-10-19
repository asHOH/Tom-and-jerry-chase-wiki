import { render, screen } from '@testing-library/react';

import { ContributionAnalytics, type ContributionAnalyticsProps } from './ContributionAnalytics';

const props: ContributionAnalyticsProps = {
  metrics: {
    total: 2,
    activeDays: 1,
    currentStreak: 1,
    longestStreak: 1,
    averagePerActiveDay: 2,
    busiestDay: null,
    monthlyBuckets: [],
  },
  months: [{ key: '2026-10', label: '10月', count: 2 }],
  categories: [{ key: 'articles', label: '文章', count: 2 }],
};

it('keeps the category breakdown available when metrics fail', () => {
  render(<ContributionAnalytics {...props} hasMetricsError />);

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('贡献指标加载失败');
  expect(alert).toHaveTextContent('请稍后刷新页面重试。');
  expect(alert).toHaveAttribute('aria-live', 'assertive');
  expect(screen.getByRole('progressbar', { name: '文章占比' })).toHaveAttribute(
    'aria-valuenow',
    '100'
  );
  expect(screen.getByText('月度趋势暂不可用')).toBeInTheDocument();
  expect(screen.queryByText('总贡献')).not.toBeInTheDocument();
});

it('keeps metrics and the monthly trend available when the breakdown fails', () => {
  render(<ContributionAnalytics {...props} hasBreakdownError />);

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('类型分布加载失败，请稍后重试。');
  expect(alert).toHaveAttribute('aria-live', 'assertive');
  expect(screen.getByText('总贡献')).toBeInTheDocument();
  expect(screen.getByRole('list', { name: '月度贡献柱状图' })).toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

it('keeps analytics loading ahead of both errors', () => {
  render(<ContributionAnalytics {...props} isLoading hasMetricsError hasBreakdownError />);

  expect(screen.getByLabelText('正在加载贡献分析')).toHaveAttribute('aria-busy', 'true');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
