import { render, screen } from '@testing-library/react';

import Button from '@/components/ui/Button';

describe('Button', () => {
  it("should default to type='button'", () => {
    render(<Button>保存</Button>);

    expect(screen.getByRole('button', { name: '保存' })).toHaveAttribute('type', 'button');
  });
});
