import { render, screen } from '@testing-library/react';

import Button from '@/components/ui/Button';

describe('Button', () => {
  it('defaults to a button with primary action and focus styling', () => {
    render(<Button>保存</Button>);

    expect(screen.getByRole('button', { name: '保存' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: '保存' })).toHaveClass(
      'bg-action-primary',
      'text-action-primary-foreground',
      'hover:bg-action-primary-hover',
      'focus-visible:outline-focus'
    );
  });

  it('uses shared foreground and background pairs for semantic actions', () => {
    render(
      <>
        <Button variant='danger'>删除</Button>
        <Button variant='success'>通过</Button>
        <Button variant='warning'>待审核</Button>
      </>
    );

    expect(screen.getByRole('button', { name: '删除' })).toHaveClass(
      'bg-action-danger',
      'text-action-danger-foreground',
      'hover:bg-action-danger-hover'
    );

    expect(screen.getByRole('button', { name: '通过' })).toHaveClass(
      'bg-action-success',
      'text-action-success-foreground',
      'hover:bg-action-success-hover'
    );
    expect(screen.getByRole('button', { name: '待审核' })).toHaveClass(
      'bg-action-warning',
      'text-action-warning-foreground',
      'hover:bg-action-warning-hover'
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
