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
    render(<ActionTile title='Changelog' ariaLabel='Changelog' />);

    expect(screen.getByRole('button', { name: 'Changelog' })).toBeInTheDocument();
  });

  it('renders an internal link when href is provided', () => {
    render(<ActionTile title='Mechanics' ariaLabel='Mechanics' href='/mechanics/object' />);

    expect(screen.getByRole('link', { name: 'Mechanics' })).toHaveAttribute(
      'href',
      '/mechanics/object'
    );
  });

  it('renders an external anchor when external and href are provided', () => {
    render(
      <ActionTile
        title='Main site'
        ariaLabel='Main site'
        href='https://www.tjwiki.com'
        external
        layout='stacked'
      />
    );

    const link = screen.getByRole('link', { name: 'Main site' });

    expect(link).toHaveAttribute('href', 'https://www.tjwiki.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('allows interaction when interaction is normal', () => {
    const onClick = jest.fn();

    render(<ActionTile title='Easter egg' ariaLabel='Easter egg' interaction='normal' onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Easter egg' });
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
        title='Current page'
        ariaLabel='Current page'
        href='/mechanics/object'
        interaction='current-page'
        onClick={onClick}
        tone='active'
      />
    );

    const link = screen.getByRole('link', { name: 'Current page' });
    fireEvent.click(link);

    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies disabled semantics and blocks clicks when interaction is disabled', () => {
    const onClick = jest.fn();

    render(<ActionTile title='Disabled' ariaLabel='Disabled' interaction='disabled' onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Disabled' });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders stacked utility tiles with visible description text', () => {
    render(
      <ActionTile
        title='Changelog'
        description='View site update history'
        ariaLabel='Changelog'
        layout='stacked'
      />
    );

    expect(screen.getByRole('button', { name: 'Changelog' })).toBeInTheDocument();
    expect(screen.getByText('View site update history')).toBeInTheDocument();
  });

  it('keeps active stacked external tiles interactive', () => {
    render(
      <ActionTile
        title='Main site'
        description='Faster access with more features'
        ariaLabel='Main site'
        href='https://www.tjwiki.com'
        external
        layout='stacked'
        tone='active'
      />
    );

    const link = screen.getByRole('link', { name: 'Main site' });

    expect(link).toHaveAttribute('href', 'https://www.tjwiki.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Faster access with more features')).toBeInTheDocument();
  });
});
