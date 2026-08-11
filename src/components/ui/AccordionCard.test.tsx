import { render, screen } from '@testing-library/react';

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

  it('uses tone-based emphasis instead of link styling for the active header', () => {
    render(
      <AccordionCard
        defaultOpenId='first'
        items={[
          { id: 'first', title: 'First', children: 'First content' },
          { id: 'second', title: 'Second', children: 'Second content', color: 'lime' },
        ]}
      />
    );

    const activeHeader = screen.getByRole('button', { name: 'First' });
    expect(activeHeader).toHaveClass('bg-control-hover', 'shadow-inner');
    expect(activeHeader).not.toHaveClass('italic');
    expect(activeHeader).not.toHaveClass('underline');

    expect(screen.getByRole('button', { name: 'Second' })).toHaveClass(
      'border-lime-200',
      'bg-lime-100'
    );
  });
});
