import { render, screen } from '@testing-library/react';

import PageShell from './PageShell';

describe('PageShell', () => {
  it('renders content without introducing another main landmark', () => {
    render(<PageShell>页面内容</PageShell>);

    expect(screen.getByText('页面内容')).toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });

  it('supports semantic element and class overrides', () => {
    render(
      <PageShell
        as='section'
        aria-label='页面区域'
        width='wide'
        className='max-w-3xl py-8 text-gray-700'
      >
        页面内容
      </PageShell>
    );

    const shell = screen.getByRole('region', { name: '页面区域' });
    expect(shell).toHaveTextContent('页面内容');
    expect(shell).toHaveClass('max-w-3xl', 'py-8', 'text-gray-700');
    expect(shell).not.toHaveClass('max-w-6xl', 'text-foreground');
  });
});
