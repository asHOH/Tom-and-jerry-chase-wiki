import { render, screen } from '@testing-library/react';

import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';

describe('IconButton', () => {
  it("should default to type='button'", () => {
    render(
      <IconButton aria-label='添加' variant='add'>
        +
      </IconButton>
    );

    expect(screen.getByRole('button', { name: '添加' })).toHaveAttribute('type', 'button');
  });

  it('should apply add variant and md size by default', () => {
    render(
      <IconButton aria-label='添加' variant='add'>
        +
      </IconButton>
    );

    expect(screen.getByRole('button', { name: '添加' })).toHaveClass(
      'h-8',
      'w-8',
      'bg-green-600',
      'text-white'
    );
  });

  it('should support delete, edit, and child icon size classes', () => {
    render(
      <>
        <IconButton aria-label='删除' variant='delete' size='xs' className='ml-auto'>
          -
        </IconButton>
        <IconButton aria-label='编辑' variant='edit' size='sm'>
          E
        </IconButton>
      </>
    );

    expect(screen.getByRole('button', { name: '删除' })).toHaveClass(
      'h-4',
      'w-4',
      'bg-red-500',
      'ml-auto'
    );
    expect(screen.getByRole('button', { name: '编辑' })).toHaveClass('h-7', 'w-7', 'bg-blue-500');
    expect(getIconButtonIconClassName('xs')).toBe('h-3 w-3');
    expect(getIconButtonIconClassName('sm')).toBe('h-3.5 w-3.5');
    expect(getIconButtonIconClassName('md')).toBe('h-4 w-4');
  });
});
