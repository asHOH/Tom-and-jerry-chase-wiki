import { render, screen } from '@testing-library/react';

import Button from '@/components/ui/Button';

describe('Button', () => {
  it("should default to type='button'", () => {
    render(<Button>保存</Button>);

    expect(screen.getByRole('button', { name: '保存' })).toHaveAttribute('type', 'button');
  });

  it('uses accessible foreground and background pairs for semantic actions', () => {
    render(
      <>
        <Button variant='success'>通过</Button>
        <Button variant='warning'>待审核</Button>
      </>
    );

    expect(screen.getByRole('button', { name: '通过' })).toHaveClass(
      'bg-green-700',
      'text-white',
      'dark:bg-green-800'
    );
    expect(screen.getByRole('button', { name: '待审核' })).toHaveClass(
      'bg-amber-400',
      'text-amber-950',
      'dark:bg-amber-800',
      'dark:text-white'
    );
  });

  it('uses semantic neutral control surfaces for secondary actions', () => {
    render(<Button variant='secondary'>取消</Button>);

    expect(screen.getByRole('button', { name: '取消' })).toHaveClass(
      'bg-control',
      'hover:bg-control-hover'
    );
  });
});
