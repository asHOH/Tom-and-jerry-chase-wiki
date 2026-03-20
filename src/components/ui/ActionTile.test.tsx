import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import ActionTile from './ActionTile';

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) {
    return React.createElement('a', { href, ...props }, children);
  },
}));

describe('ActionTile', () => {
  it('renders an internal link for navigation tiles', () => {
    render(<ActionTile title='机制' ariaLabel='机制' href='/mechanics/object' />);

    const link = screen.getByRole('link', { name: '机制' });

    expect(link).toHaveAttribute('href', '/mechanics/object');
    expect(link).toHaveClass('rounded-lg', 'shadow-md');
  });

  it('applies current-page semantics and blocks clicks for active links', () => {
    const onClick = jest.fn();

    render(
      <ActionTile
        title='当前页面'
        ariaLabel='当前页面'
        href='/mechanics/object'
        interaction='current-page'
        onClick={onClick}
        tone='active'
      />
    );

    const link = screen.getByRole('link', { name: '当前页面' });
    fireEvent.click(link);

    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveClass('pointer-events-none', 'cursor-not-allowed', 'bg-blue-600');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a disabled button when no href is provided', () => {
    const onClick = jest.fn();

    render(<ActionTile title='禁用' ariaLabel='禁用' interaction='disabled' onClick={onClick} />);

    const button = screen.getByRole('button', { name: '禁用' });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders stacked utility tiles with description text', () => {
    render(
      <ActionTile
        title='更新日志'
        description='查看网站更新历史'
        ariaLabel='更新日志'
        layout='stacked'
      />
    );

    const button = screen.getByRole('button', { name: '更新日志' });

    expect(button).toHaveClass('rounded-md', 'min-w-[180px]', 'px-6', 'py-4');
    expect(screen.getByText('查看网站更新历史')).toHaveClass('mt-1', 'text-sm', 'text-gray-500');
  });

  it('renders active stacked external tiles without disabling interaction', () => {
    render(
      <ActionTile
        title='主站'
        description='访问较快，功能较全'
        ariaLabel='主站'
        href='https://www.tjwiki.com'
        external
        layout='stacked'
        tone='active'
      />
    );

    const link = screen.getByRole('link', { name: '主站' });

    expect(link).toHaveAttribute('href', 'https://www.tjwiki.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).toHaveClass('bg-blue-100', 'text-blue-900', 'ring-2', 'ring-blue-500');
    expect(screen.getByText('访问较快，功能较全')).toHaveClass('text-blue-700');
  });
});
