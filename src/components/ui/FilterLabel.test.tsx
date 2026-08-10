import { render, screen } from '@testing-library/react';

import FilterLabel from './FilterLabel';

describe('FilterLabel', () => {
  it('keeps the compact mobile label on one line without shrinking', () => {
    render(<FilterLabel id='type-filter' full='类型筛选:' />);

    const compactLabel = screen.getByText('类型:');

    expect(compactLabel).toHaveClass('shrink-0', 'whitespace-nowrap', 'sm:hidden');
    expect(document.getElementById('type-filter')).toHaveTextContent('类型筛选:');
  });
});
