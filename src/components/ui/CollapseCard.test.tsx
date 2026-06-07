import { fireEvent, render, screen } from '@testing-library/react';

import CollapseCard from './CollapseCard';

describe('CollapseCard', () => {
  it('does not mount collapsed children until expanded when lazyMount is enabled', () => {
    render(
      <CollapseCard title='Details' lazyMount>
        <div>Expensive content</div>
      </CollapseCard>
    );

    expect(screen.queryByText('Expensive content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Details/i }));

    expect(screen.getByText('Expensive content')).toBeInTheDocument();
  });
});
