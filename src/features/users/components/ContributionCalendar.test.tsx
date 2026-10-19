import { render, screen } from '@testing-library/react';

import { ContributionCalendar } from './ContributionCalendar';

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
