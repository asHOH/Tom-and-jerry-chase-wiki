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
        'focus-visible:ring-blue-500'
      );
    }
  });
});
