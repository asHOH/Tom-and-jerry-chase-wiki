import { fireEvent, render, screen } from '@testing-library/react';

import HomepageNotices from './HomepageNotices';

jest.mock('swr', () => ({
  __esModule: true,
  default: () => ({
    data: {
      notices: [
        {
          id: 'notice-1',
          title: '2026.11.14网站更新',
          contentHtml: '<p>更新内容。</p>',
          startsAt: '2026-11-14T00:00:00.000Z',
          endsAt: null,
        },
        {
          id: 'notice-2',
          title: '旧公告',
          contentHtml: '<p>旧内容。</p>',
          startsAt: '2026-11-01T00:00:00.000Z',
          endsAt: null,
        },
      ],
    },
  }),
}));

jest.mock('@/lib/localStorage', () => ({
  StorageKey: { HomepageDismissedNotices: 'homepage-dismissed-notices' },
  storage: {
    getJson: () => null,
    setJson: () => true,
  },
}));

describe('HomepageNotices', () => {
  it('collapses notice content until expanded', () => {
    render(<HomepageNotices />);

    expect(screen.getByText('2026.11.14网站更新')).toBeInTheDocument();
    expect(screen.queryByText('更新内容。')).not.toBeInTheDocument();
    expect(screen.queryByText(/查看其他展示中的公告/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '展开' }));

    expect(screen.getByText('更新内容。')).toBeInTheDocument();
    expect(screen.getByText(/查看其他展示中的公告（1）/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收起' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: '收起' }));

    expect(screen.queryByText('更新内容。')).not.toBeInTheDocument();
  });
});
