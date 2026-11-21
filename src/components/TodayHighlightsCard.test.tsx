import { render, screen } from '@testing-library/react';

import TodayHighlightsCard from './TodayHighlightsCard';

jest.mock('@/lib/gameUtils', () => ({
  ...jest.requireActual('@/lib/gameUtils'),
  getGameDate: () => new Date(2026, 10, 22),
}));

jest.mock('@/context/TraitsContext', () => ({
  useTraitsData: () => ({
    测试特性: {
      description: '测试特性描述',
      group: [
        { name: '汤姆', type: 'character' },
        { name: '番茄', type: 'item' },
      ],
    },
  }),
}));

jest.mock('@/features/shared/history/onThisDay', () => ({
  ...jest.requireActual('@/features/shared/history/onThisDay'),
  getOnThisDayEvents: () => ({
    topTier: [
      {
        year: 2015,
        date: '5.13',
        description: '网易获得《猫和老鼠》IP代理权。',
        milestone: 'IP代理权确认',
      },
    ],
    others: [],
  }),
}));

describe('TodayHighlightsCard', () => {
  it('renders the daily trait and history entries without a wrapper heading', () => {
    render(<TodayHighlightsCard />);

    expect(screen.queryByRole('heading', { name: '今日' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '每日特性' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '历史上的今天' })).toBeInTheDocument();
    expect(screen.getByText(/测试特性描述/)).toBeInTheDocument();
    expect(screen.getByText('网易获得《猫和老鼠》IP代理权。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看全部特性' })).toHaveAttribute(
      'href',
      '/mechanics/traitCollection'
    );
    expect(screen.getAllByText('2026年11月22日')).toHaveLength(1);
  });
});
