import { fireEvent, render, screen } from '@testing-library/react';

import AccordionCard from './AccordionCard';

describe('AccordionCard', () => {
  it('keeps a visible keyboard focus indicator on every header', () => {
    render(
      <AccordionCard
        items={[
          { id: 'first', title: 'First', children: 'First content' },
          { id: 'second', title: 'Second', children: 'Second content' },
        ]}
      />
    );

    for (const header of screen.getAllByRole('button')) {
      expect(header).toHaveClass(
        'focus-visible:ring-2',
        'focus-visible:ring-inset',
        'focus-visible:ring-focus'
      );
    }
  });

  it('opens the default panel, switches panels, and closes and reopens them', () => {
    render(
      <AccordionCard
        defaultOpenId='first'
        items={[
          { id: 'first', title: 'First', children: 'First content' },
          { id: 'second', title: 'Second', children: 'Second content' },
        ]}
      />
    );

    const firstHeader = screen.getByRole('button', { name: 'First' });
    const secondHeader = screen.getByRole('button', { name: 'Second' });
    expect(firstHeader).toHaveAttribute('aria-expanded', 'true');
    expect(secondHeader).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('First content')).toBeVisible();
    expect(screen.queryByText('Second content')).not.toBeInTheDocument();

    fireEvent.click(secondHeader);
    expect(firstHeader).toHaveAttribute('aria-expanded', 'false');
    expect(secondHeader).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText('First content')).not.toBeInTheDocument();
    expect(screen.getByText('Second content')).toBeVisible();

    fireEvent.click(secondHeader);
    expect(firstHeader).toHaveAttribute('aria-expanded', 'false');
    expect(secondHeader).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('First content')).not.toBeInTheDocument();
    expect(screen.queryByText('Second content')).not.toBeInTheDocument();

    fireEvent.click(firstHeader);
    expect(firstHeader).toHaveAttribute('aria-expanded', 'true');
    expect(secondHeader).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('First content')).toBeVisible();
    expect(screen.queryByText('Second content')).not.toBeInTheDocument();
  });
});
