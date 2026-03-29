import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import FactionButton from './FactionButton';

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
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: function MockImage({
    preload,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { preload?: boolean }) {
    return React.createElement('img', {
      ...props,
      alt,
      'data-preload': preload ? 'true' : 'false',
    });
  },
}));

describe('FactionButton', () => {
  it('keeps decorative image alt text empty for linked tiles', () => {
    render(
      <FactionButton
        title='Characters'
        description='Open the character list'
        href='/characters'
        ariaLabel='Open the character list'
        imageSrc='/images/icons/mouse-faction.png'
        imageAlt=''
        preload
      />
    );

    const link = screen.getByRole('link', { name: 'Open the character list' });
    const image = link.querySelector('img');
    const title = screen.getByText('Characters');
    const description = screen.getByText('Open the character list');
    const titleWrapper = title.closest('span.font-bold');
    const contentRow = image?.closest('span.flex');

    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('alt', '');
    expect(link).toHaveClass(
      'min-w-[180px]',
      'flex-1',
      'gap-1',
      'py-3',
      'md:gap-2',
      'hover:-translate-y-0.5'
    );
    expect(link).not.toHaveClass('faction-button');
    expect(image).toHaveAttribute('data-preload', 'true');
    expect(image).toHaveClass('faction-button-image');
    expect(titleWrapper).toHaveClass('text-xl', 'font-bold', 'whitespace-nowrap', 'md:text-2xl');
    expect(contentRow).toHaveClass('flex', 'items-center', 'gap-2', 'md:gap-3');
    expect(description).toHaveClass(
      'mt-0.5',
      'text-xs',
      'text-gray-500',
      'md:mt-1',
      'md:text-sm',
      'dark:text-gray-400'
    );
  });

  it('renders a clickable button with emoji fallback when href is absent', () => {
    const onClick = jest.fn();

    render(
      <FactionButton
        emoji='egg'
        title='Easter Egg'
        description='Open the easter egg panel'
        onClick={onClick}
        ariaLabel='Open the easter egg panel'
      />
    );

    const button = screen.getByRole('button', { name: 'Open the easter egg panel' });
    fireEvent.click(button);

    expect(button).toHaveClass('min-w-[180px]', 'flex-1', 'py-3', 'hover:-translate-y-0.5');
    expect(button).not.toHaveClass('faction-button');
    expect(screen.getByText('egg')).toHaveClass('text-xl', 'md:text-2xl');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
