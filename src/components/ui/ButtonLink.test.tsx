import React from 'react';
import { render, screen } from '@testing-library/react';

import ButtonLink from './ButtonLink';

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    preserveEditParam,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
    preserveEditParam?: boolean;
  }) {
    return React.createElement(
      'a',
      { href, 'data-preserve-edit-param': preserveEditParam ? 'true' : undefined, ...props },
      children
    );
  },
}));

describe('ButtonLink', () => {
  it('renders an app link with button styling', () => {
    render(<ButtonLink href='/articles/new'>新建文章</ButtonLink>);

    const link = screen.getByRole('link', { name: '新建文章' });
    expect(link).toHaveAttribute('href', '/articles/new');
    expect(link).toHaveClass('inline-flex', 'bg-blue-600', 'rounded-lg', 'px-4', 'py-2.5');
  });

  it('supports variants, sizing, icons, custom classes, and edit-param preservation', () => {
    render(
      <ButtonLink
        href='/admin/'
        variant='warning'
        size='sm'
        className='shadow-lg'
        preserveEditParam
        leadingIcon={<span aria-hidden='true'>!</span>}
        trailingIcon={<span aria-hidden='true'>→</span>}
      >
        待审核
      </ButtonLink>
    );

    const link = screen.getByRole('link', { name: '待审核' });
    expect(link).toHaveClass('bg-yellow-500', 'text-sm', 'px-3', 'py-2', 'shadow-lg');
    expect(link).toHaveAttribute('data-preserve-edit-param', 'true');
  });

  it('supports full width layout', () => {
    render(
      <ButtonLink href='/offline/' fullWidth>
        重试
      </ButtonLink>
    );

    expect(screen.getByRole('link', { name: '重试' })).toHaveClass('w-full');
  });
});
