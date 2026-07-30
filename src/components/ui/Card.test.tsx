import { render, screen } from '@testing-library/react';

import Card from '@/components/ui/Card';

describe('Card', () => {
  it('renders as a passive surface by default', () => {
    render(<Card>内容</Card>);

    const card = screen.getByText('内容');
    expect(card).toHaveClass('rounded-lg', 'bg-surface');
    expect(card).not.toHaveClass('border', 'border-border');
    expect(card).not.toHaveClass('shadow-sm', 'hover:shadow-md');
  });

  it('adds a border only when requested', () => {
    render(<Card bordered>带边框内容</Card>);

    expect(screen.getByText('带边框内容')).toHaveClass('border', 'border-border');
  });

  it('adds elevation without a border when interactive', () => {
    render(<Card interactive>可交互内容</Card>);

    const card = screen.getByText('可交互内容');
    expect(card).toHaveClass('shadow-sm', 'hover:shadow-md');
    expect(card).not.toHaveClass('border', 'hover:border-blue-300');
  });

  it('adds border hover feedback to bordered interactive cards', () => {
    render(
      <Card bordered interactive>
        带边框可交互内容
      </Card>
    );

    expect(screen.getByText('带边框可交互内容')).toHaveClass('border', 'hover:border-blue-300');
  });

  it('supports rendering a different element', () => {
    render(<Card as='section'>区域内容</Card>);

    expect(screen.getByText('区域内容').tagName).toBe('SECTION');
  });
});
