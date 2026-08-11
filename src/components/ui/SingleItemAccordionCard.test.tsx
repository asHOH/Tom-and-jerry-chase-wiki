import { fireEvent, render, screen } from '@testing-library/react';

import SingleItemAccordionCard from './SingleItemAccordionCard';

jest.mock('@/components/ui/SingleItemButton', () => {
  return function MockSingleItemButton({ singleItem }: { singleItem: { name: string } }) {
    return <span>{singleItem.name}</span>;
  };
});

describe('SingleItemAccordionCard', () => {
  it('exposes its disclosure state', () => {
    render(
      <SingleItemAccordionCard
        label='角色'
        items={[
          { name: '汤姆', type: 'character' },
          { name: '杰瑞', type: 'character' },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: '展开角色列表' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(screen.getByRole('button', { name: '折叠角色列表' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});
