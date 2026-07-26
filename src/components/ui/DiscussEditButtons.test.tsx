import { render, screen } from '@testing-library/react';

import DiscussEditButtons from '@/components/ui/DiscussEditButtons';

jest.mock('@/components/ui/DiscussButton', () => ({
  __esModule: true,
  default: ({ className, compact }: { className?: string; compact?: boolean }) => (
    // eslint-disable-next-line next/no-html-link-for-pages
    <a
      href='/discussion/'
      data-class-name={className ?? ''}
      data-compact={String(compact ?? false)}
    >
      讨论
    </a>
  ),
}));

jest.mock('@/components/ui/EditButton', () => ({
  __esModule: true,
  default: ({ className, compact }: { className?: string; compact?: boolean }) => (
    <button type='button' data-class-name={className ?? ''} data-compact={String(compact ?? false)}>
      编辑
    </button>
  ),
}));

describe('DiscussEditButtons', () => {
  it('renders joined discuss and edit buttons outside edit mode', () => {
    render(<DiscussEditButtons compact isEditMode={false} className='mt-2' />);

    const discussButton = screen.getByRole('link', { name: '讨论' });
    const editButton = screen.getByRole('button', { name: '编辑' });

    expect(discussButton).toHaveAttribute('data-class-name', 'rounded-r-none');
    expect(discussButton).toHaveAttribute('data-compact', 'true');
    expect(editButton).toHaveAttribute('data-class-name', '-ml-px rounded-l-none');
    expect(editButton).toHaveAttribute('data-compact', 'true');
    expect(discussButton.parentElement).toHaveClass('inline-flex', 'rounded-md', 'mt-2');
  });

  it('renders only the discuss button in edit mode without split-radius classes', () => {
    render(<DiscussEditButtons compact isEditMode className='mt-1' />);

    const discussButton = screen.getByRole('link', { name: '讨论' });

    expect(discussButton).toHaveAttribute('data-class-name', '');
    expect(discussButton).toHaveAttribute('data-compact', 'true');
    expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument();
    expect(discussButton.parentElement).toHaveClass('inline-flex', 'rounded-md', 'mt-1');
  });
});
