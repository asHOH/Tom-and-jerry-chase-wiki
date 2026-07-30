import { render, screen } from '@testing-library/react';

import SectionHeader from './SectionHeader';

describe('SectionHeader', () => {
  it('uses the standard hierarchy by default', () => {
    render(<SectionHeader title='角色数据' />);

    const heading = screen.getByRole('heading', { level: 2, name: '角色数据' });

    expect(heading).toHaveClass('py-2', 'text-2xl', 'font-bold');
    expect(heading.parentElement?.parentElement).toHaveClass('mb-3');
  });

  it('uses compact hierarchy and renders trailing content', () => {
    render(
      <SectionHeader title='评论' variant='compact'>
        <span>3 条</span>
      </SectionHeader>
    );

    const heading = screen.getByRole('heading', { level: 2, name: '评论' });

    expect(heading).toHaveClass('text-lg', 'font-bold');
    expect(heading).not.toHaveClass('py-2', 'text-2xl');
    expect(heading.parentElement?.parentElement).toHaveClass('mb-4');
    expect(screen.getByText('3 条')).toBeInTheDocument();
  });
});
