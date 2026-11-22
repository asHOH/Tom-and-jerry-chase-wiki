import { render, screen } from '@testing-library/react';

import UnitQuantity from './unitQuantity';

describe('UnitQuantity', () => {
  it('renders the quantity as a link to the move mechanics page', () => {
    render(<UnitQuantity text='790单位长/s' />);

    const link = screen.getByRole('link', { name: '790单位长/s' });
    expect(link).toHaveAttribute('href', '/mechanics/move');
    expect(link).toHaveClass('text-blue-500', 'underline', 'dark:text-sky-300');
  });
});
