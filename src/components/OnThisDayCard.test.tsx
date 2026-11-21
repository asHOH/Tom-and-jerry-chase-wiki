import { fireEvent, render, screen } from '@testing-library/react';

import { getOnThisDayEvents } from '@/features/shared/history/onThisDay';

import OnThisDayCard from './OnThisDayCard';

jest.mock('@/features/shared/history/onThisDay', () => ({
  ...jest.requireActual('@/features/shared/history/onThisDay'),
  getOnThisDayEvents: jest.fn(),
}));

const getEntriesMock = jest.mocked(getOnThisDayEvents);

beforeEach(() => {
  getEntriesMock.mockReturnValue({
    topTier: [
      {
        year: 2015,
        date: '5.13',
        description: '网易获得《猫和老鼠》IP代理权。',
        milestone: 'IP代理权确认',
      },
    ],
    others: [
      { year: 2018, date: '5.12-5.19', description: '游戏开启第三次测试。' },
      { year: 2019, date: '5.14-5.20', description: '游戏开启第四次测试。' },
    ],
  });
});

describe('OnThisDayCard', () => {
  it('shows only the top tier by default', () => {
    render(<OnThisDayCard />);

    expect(screen.getByRole('heading', { name: '历史上的今天' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('2015年 · 5月13日')).toBeInTheDocument();
    expect(screen.getByText('网易获得《猫和老鼠》IP代理权。')).toBeInTheDocument();
    expect(screen.getAllByText('IP代理权确认')).toHaveLength(1);
    expect(screen.queryByText('游戏开启第三次测试。')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '展开其余 2 条' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('reveals the remaining entries when expanded and hides them again', () => {
    render(<OnThisDayCard />);

    fireEvent.click(screen.getByRole('button', { name: '展开其余 2 条' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('游戏开启第三次测试。')).toBeInTheDocument();
    expect(screen.getByText('游戏开启第四次测试。')).toBeInTheDocument();

    const collapseButton = screen.getByRole('button', { name: '收起' });
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(collapseButton);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText('游戏开启第三次测试。')).not.toBeInTheDocument();
  });

  it('omits the toggle when every entry is already visible', () => {
    getEntriesMock.mockReturnValue({
      topTier: [{ year: 2015, date: '5.13', description: '网易获得《猫和老鼠》IP代理权。' }],
      others: [],
    });

    render(<OnThisDayCard />);

    expect(screen.getByText('网易获得《猫和老鼠》IP代理权。')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when no entry matches the date', () => {
    getEntriesMock.mockReturnValue({ topTier: [], others: [] });

    render(<OnThisDayCard />);

    expect(screen.queryByRole('heading', { name: '历史上的今天' })).not.toBeInTheDocument();
  });
});
