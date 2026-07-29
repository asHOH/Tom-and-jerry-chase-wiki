import { render, screen } from '@testing-library/react';

import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders the shared title, description, actions, and supporting content', () => {
    render(
      <PageHeader
        title='页面标题'
        description='页面说明'
        actions={<button type='button'>页面操作</button>}
      >
        <div>页面筛选</div>
      </PageHeader>
    );

    expect(screen.getByRole('heading', { level: 1, name: '页面标题' })).toHaveClass(
      'text-blue-600',
      'tracking-tight'
    );
    expect(screen.getByText('页面说明')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '页面操作' })).toBeInTheDocument();
    expect(screen.getByText('页面筛选')).toBeInTheDocument();

    const header = screen.getByRole('heading', { level: 1 }).parentElement;
    expect(header).not.toHaveClass('px-2', 'md:px-4');
    expect(screen.getByText('页面说明')).not.toHaveClass('px-2', 'md:px-4');
  });

  it('supports desktop-only descriptions', () => {
    render(
      <PageHeader title='页面标题' description='桌面端说明' descriptionVisibility='desktop' />
    );

    expect(screen.getByText('桌面端说明').parentElement).toHaveClass('sr-only', 'md:not-sr-only');
  });

  it('merges layout and typography overrides', () => {
    const { container } = render(
      <PageHeader
        title='紧凑标题'
        description='紧凑说明'
        className='mb-8'
        titleClassName='text-3xl'
        descriptionClassName='max-w-xl'
      />
    );

    expect(container.querySelector('header')).toHaveClass('mb-8');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('text-3xl');
    expect(screen.getByText('紧凑说明')).toHaveClass('max-w-xl');
  });
});
