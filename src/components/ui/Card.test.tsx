import { render, screen } from '@testing-library/react';

import Card from '@/components/ui/Card';

describe('Card', () => {
  it('renders as a passive surface by default', () => {
    render(<Card>内容</Card>);

    const card = screen.getByText('内容');
    expect(card).toHaveClass('rounded-lg', 'border', 'border-gray-200', 'bg-white');
    expect(card).not.toHaveClass('shadow-sm', 'hover:shadow-md');
  });

  it('adds elevation and hover feedback when interactive', () => {
    render(<Card interactive>可交互内容</Card>);

    expect(screen.getByText('可交互内容')).toHaveClass(
      'shadow-sm',
      'hover:border-blue-300',
      'hover:shadow-md'
    );
  });

  it('supports rendering a different element', () => {
    render(<Card as='section'>区域内容</Card>);

    expect(screen.getByText('区域内容').tagName).toBe('SECTION');
  });
});
