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
  it('renders a button when href is not provided', () => {
    render(<ActionTile title='更新日志' ariaLabel='更新日志' />);

    expect(screen.getByRole('button', { name: '更新日志' })).toBeInTheDocument();
  });

  it('renders an internal link when href is provided', () => {
    render(<ActionTile title='机制' ariaLabel='机制' href='/mechanics/object' />);

    const link = screen.getByRole('link', { name: '机制' });

    expect(link).toHaveAttribute('href', '/mechanics/object');
    expect(link).toHaveClass('rounded-lg', 'shadow-md');
  });

  it('renders an external anchor when external and href are provided', () => {
    render(
      <ActionTile
        title='主站'
        ariaLabel='主站'
        href='https://www.tjwiki.com'
        external
        layout='stacked'
      />
    );

    const link = screen.getByRole('link', { name: '主站' });

    expect(link).toHaveAttribute('href', 'https://www.tjwiki.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('allows interaction when interaction is normal', () => {
    const onClick = jest.fn();

    render(<ActionTile title='彩蛋' ariaLabel='彩蛋' interaction='normal' onClick={onClick} />);

    const button = screen.getByRole('button', { name: '彩蛋' });
    fireEvent.click(button);

    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-current');
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(button).not.toHaveAttribute('tabindex');
    expect(onClick).toHaveBeenCalledTimes(1);
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

  it('applies disabled semantics and blocks clicks when interaction is disabled', () => {
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

  it('keeps active stacked external tiles interactive when tone is active', () => {
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
