import React from 'react';
import { render, screen } from '@testing-library/react';

import type { ActionTileProps } from '@/components/ui/ActionTile';

import FactionButton from './FactionButton';

const mockActionTile = jest.fn();

jest.mock('@/components/ui/ActionTile', () => ({
  __esModule: true,
  default: function MockActionTile(props: ActionTileProps) {
    mockActionTile(props);
    return (
      <div data-testid='action-tile'>
        {props.title}
        <div>{props.description}</div>
      </div>
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes a decorative image title block into ActionTile for linked tiles', () => {
    const { container } = render(
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

    const image = container.querySelector('img');
    const actionTileProps = mockActionTile.mock.calls[0]?.[0] as ActionTileProps | undefined;

    expect(screen.getByTestId('action-tile')).toHaveTextContent('Characters');
    expect(screen.getByText('Open the character list')).toBeInTheDocument();
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('data-preload', 'true');
    expect(actionTileProps).toMatchObject({
      description: 'Open the character list',
      ariaLabel: 'Open the character list',
      href: '/characters',
      layout: 'stacked',
    });
  });

  it('passes emoji fallback content and click handling into ActionTile when href is absent', () => {
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

    const actionTileProps = mockActionTile.mock.calls[0]?.[0] as ActionTileProps | undefined;

    expect(screen.getByTestId('action-tile')).toHaveTextContent('egg');
    expect(screen.getByTestId('action-tile')).toHaveTextContent('Easter Egg');
    expect(screen.getByText('Open the easter egg panel')).toBeInTheDocument();
    expect(actionTileProps).toMatchObject({
      description: 'Open the easter egg panel',
      ariaLabel: 'Open the easter egg panel',
      layout: 'stacked',
    });
    expect(actionTileProps?.href).toBeUndefined();
    expect(actionTileProps?.onClick).toBe(onClick);
  });
});
