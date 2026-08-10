import { render, screen } from '@testing-library/react';

import PageShell, { type PageShellWidth } from './PageShell';

const WIDTH_CASES: ReadonlyArray<[PageShellWidth, string]> = [
  ['narrow', 'max-w-4xl'],
  ['standard', 'max-w-5xl'],
  ['wide', 'max-w-6xl'],
  ['maximum', 'max-w-7xl'],
];

describe('PageShell', () => {
  it('uses the standard width by default', () => {
    render(<PageShell>页面内容</PageShell>);

    const shell = screen.getByText('页面内容');
    expect(shell.tagName).toBe('DIV');
    expect(shell).toHaveClass('mx-auto', 'w-full', 'max-w-5xl', 'text-foreground');
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });

  it.each(WIDTH_CASES)('maps the %s width to %s', (width, expectedClassName) => {
    render(<PageShell width={width}>页面内容</PageShell>);

    expect(screen.getByText('页面内容')).toHaveClass(expectedClassName);
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
    expect(shell).toHaveClass('mx-auto', 'w-full', 'max-w-3xl', 'py-8', 'text-gray-700');
    expect(shell).not.toHaveClass('max-w-6xl', 'text-foreground');
  });
});
