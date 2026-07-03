import { render, screen } from '@testing-library/react';

import Card from '@/components/ui/Card';

describe('Card', () => {
  it('renders as a passive surface by default', () => {
    render(<Card>内容</Card>);

    const card = screen.getByText('内容');
    expect(card).toHaveClass('rounded-lg', 'bg-white', 'shadow-md');
    expect(card).not.toHaveClass('hover:shadow-lg');
  });

  it('supports rendering a different element', () => {
    render(<Card as='section'>区域内容</Card>);

    expect(screen.getByText('区域内容').tagName).toBe('SECTION');
  });
});
