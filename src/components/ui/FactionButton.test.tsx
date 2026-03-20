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
  it('preserves the current image-based sizing contract for linked tiles', () => {
    render(
      <FactionButton
        title='角色'
        description='查看角色属性'
        href='/characters'
        ariaLabel='查看角色属性'
        imageSrc='/images/icons/mouse-faction.png'
        imageAlt='角色图标'
        preload
      />
    );

    const link = screen.getByRole('link', { name: '查看角色属性' });
    const image = screen.getByAltText('角色图标');
    const title = screen.getByText('角色');
    const description = screen.getByText('查看角色属性');

    expect(link).toHaveClass(
      'faction-button',
      'min-w-[180px]',
      'flex-1',
      'gap-1',
      'py-3',
      'md:gap-2',
      'hover:-translate-y-0.5'
    );
    expect(image).toHaveAttribute('data-preload', 'true');
    expect(image).toHaveClass('h-9', 'w-auto', 'flex-shrink-0', 'object-contain', 'md:h-10');
    expect(image.parentElement).toHaveClass('text-xl', 'md:text-2xl');
    expect(title).toHaveClass('text-xl', 'font-bold', 'whitespace-nowrap', 'md:text-2xl');
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
        emoji='🐭'
        title='彩蛋'
        description='打开彩蛋面板'
        onClick={onClick}
        ariaLabel='打开彩蛋面板'
      />
    );

    const button = screen.getByRole('button', { name: '打开彩蛋面板' });
    fireEvent.click(button);

    expect(button).toHaveClass(
      'faction-button',
      'min-w-[180px]',
      'flex-1',
      'py-3',
      'hover:-translate-y-0.5'
    );
    expect(screen.getByText('🐭')).toHaveClass('text-xl', 'md:text-2xl');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
