import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import { SITE_URL } from '@/constants/seo';
import RichTextDisplay from '@/components/ui/RichTextDisplay';

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
    title,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
    title?: string;
  }) => (
    <a data-testid='client-link' href={href} className={className} title={title}>
      {children}
    </a>
  ),
}));

describe('RichTextDisplay', () => {
  it('should render server-sanitized HTML immediately when provided', () => {
    const { container } = render(
      <RichTextDisplay
        content='<p>原始内容</p>'
        sanitizedContent='<p><strong>已净化内容</strong></p>'
      />
    );

    expect(container.querySelector('strong')).toHaveTextContent('已净化内容');
    expect(screen.queryByText('内容加载中...')).not.toBeInTheDocument();
  });

  it('should keep preview mode text-only', () => {
    const { container } = render(
      <RichTextDisplay content='<p><strong>预览内容</strong></p>' preview />
    );

    expect(screen.getByText('预览内容')).toBeInTheDocument();
    expect(container.querySelector('strong')).toBeNull();
  });

  it('should render root-relative article links with the client navigation component', () => {
    render(
      <RichTextDisplay content='<p><a class="rte-text-center" href="/characters/%E6%B1%A4%E5%A7%86/?from=article#skill">汤姆</a></p>' />
    );

    expect(screen.getByTestId('client-link')).toHaveAttribute(
      'href',
      '/characters/%E6%B1%A4%E5%A7%86/?from=article#skill'
    );
    expect(screen.getByTestId('client-link')).toHaveClass('rte-text-center');
  });

  it('should convert same-origin absolute links while preserving external links', () => {
    const sameOriginHref = new URL('/articles/example/?from=wiki#details', SITE_URL).toString();

    render(
      <RichTextDisplay
        content={`<p><a href="${sameOriginHref}">站内</a> <a href="https://example.com/articles">站外</a> <a href="#details">页内</a></p>`}
      />
    );

    expect(screen.getByTestId('client-link')).toHaveAttribute(
      'href',
      '/articles/example/?from=wiki#details'
    );
    expect(screen.getByRole('link', { name: '站外' })).toHaveAttribute(
      'href',
      'https://example.com/articles'
    );
    expect(screen.getByRole('link', { name: '页内' })).toHaveAttribute('href', '#details');
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });
});
