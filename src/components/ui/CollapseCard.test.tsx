import { fireEvent, render, screen } from '@testing-library/react';

import CollapseCard from './CollapseCard';

describe('CollapseCard', () => {
  it('keeps a visible keyboard focus indicator on its header', () => {
    render(<CollapseCard title='Details'>Content</CollapseCard>);

    expect(screen.getByRole('button', { name: /Details/i })).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-inset',
      'focus-visible:ring-focus'
    );
  });

  it('uses the shared neutral tone with row-specific border structure', () => {
    render(<CollapseCard title='Details'>Content</CollapseCard>);

    expect(screen.getByRole('button', { name: /Details/i })).toHaveClass(
      'border-b',
      'border-border',
      'bg-control'
    );
  });

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
