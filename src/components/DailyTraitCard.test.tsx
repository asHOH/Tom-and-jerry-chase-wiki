import { render, screen } from '@testing-library/react';

import DailyTraitCard from './DailyTraitCard';

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

describe('DailyTraitCard', () => {
  it('renders the trait of the day and links to the trait collection', () => {
    render(<DailyTraitCard />);

    expect(screen.getByRole('heading', { name: '每日特性' })).toBeInTheDocument();
    expect(screen.getByText(/测试特性描述/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看全部特性' })).toHaveAttribute(
      'href',
      '/mechanics/traitCollection'
    );
  });
});
