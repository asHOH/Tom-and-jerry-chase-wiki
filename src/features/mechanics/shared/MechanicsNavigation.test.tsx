import React from 'react';
import { render, screen } from '@testing-library/react';

import type { ActionTileProps } from '@/components/ui/ActionTile';
import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import UsagesNavigation from '@/features/usages/shared/UsagesNavigation';

import MechanicsNavigation from './MechanicsNavigation';

const mockMechanicsNavItems = [
  {
    id: 'object',
    label: 'Object',
    href: '/mechanics/object',
    iconSrc: '/images/object.png',
    iconAlt: 'Object',
  },
  {
    id: 'move',
    label: 'Move',
    href: '/mechanics/move',
    iconSrc: '/images/move.png',
    iconAlt: 'Move',
  },
] as const;

const mockUsagesNavItems = [
  {
    id: 'use',
    label: 'Usage',
    href: '/usages/use',
    iconSrc: '/images/use.png',
    iconAlt: 'Usage',
  },
  {
    id: 'edit',
    label: 'Edit',
    href: '/usages/edit',
    iconSrc: '/images/edit.png',
    iconAlt: 'Edit',
  },
] as const;

const mockActionTile = jest.fn();

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: jest.fn(),
}));

jest.mock('@/hooks/useNavigationTabs', () => ({
  useNavigationTabs: jest.fn(),
}));

jest.mock('../sections', () => ({
  MECHANICS_NAV_ITEMS: [
    {
      id: 'object',
      label: 'Object',
      href: '/mechanics/object',
      iconSrc: '/images/object.png',
      iconAlt: 'Object',
    },
    {
      id: 'move',
      label: 'Move',
      href: '/mechanics/move',
      iconSrc: '/images/move.png',
      iconAlt: 'Move',
    },
  ],
}));

jest.mock('../../usages/sections', () => ({
  USAGES_NAV_ITEMS: [
    {
      id: 'use',
      label: 'Usage',
      href: '/usages/use',
      iconSrc: '/images/use.png',
      iconAlt: 'Usage',
    },
    {
      id: 'edit',
      label: 'Edit',
      href: '/usages/edit',
      iconSrc: '/images/edit.png',
      iconAlt: 'Edit',
    },
  ],
}));

jest.mock('@/components/ui/ActionTile', () => ({
  __esModule: true,
  default: function MockActionTile(props: ActionTileProps) {
    mockActionTile(props);
    return <div data-testid='action-tile'>{props.ariaLabel}</div>;
  },
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    return React.createElement('img', { ...props, alt: props.alt });
  },
}));

const mockedUseMobile = jest.mocked(useMobile);
const mockedUseNavigationTabs = jest.mocked(useNavigationTabs);

describe('Navigation tile semantics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseMobile.mockReturnValue(false);
  });

  it('marks active mechanics tabs as current-page and leaves inactive ones interactive', () => {
    mockedUseNavigationTabs.mockReturnValue({
      isActive: (href: string) => href === mockMechanicsNavItems[0].href,
      items: [] as const,
      pathname: mockMechanicsNavItems[0].href,
    });

    render(<MechanicsNavigation description='Mechanics description' />);

    expect(screen.getAllByTestId('action-tile')).toHaveLength(4);

    const actionTileProps = mockActionTile.mock.calls.map((call) => call[0] as ActionTileProps);
    const activeTiles = actionTileProps.filter((props) => props.href === mockMechanicsNavItems[0].href);
    const inactiveTiles = actionTileProps.filter((props) => props.href === mockMechanicsNavItems[1].href);

    expect(activeTiles).toHaveLength(2);
    expect(inactiveTiles).toHaveLength(2);
    activeTiles.forEach((props) => {
      expect(props).toMatchObject({
        ariaLabel: 'Object',
        href: '/mechanics/object',
        interaction: 'current-page',
        size: 'md',
        title: 'Object',
        tone: 'active',
      });
    });
    inactiveTiles.forEach((props) => {
      expect(props).toMatchObject({
        ariaLabel: 'Move',
        href: '/mechanics/move',
        interaction: 'normal',
        size: 'md',
        title: 'Move',
        tone: 'default',
      });
    });
  });

  it('marks active usage tabs as current-page and leaves inactive ones interactive', () => {
    mockedUseNavigationTabs.mockReturnValue({
      isActive: (href: string) => href === mockUsagesNavItems[0].href,
      items: [] as const,
      pathname: mockUsagesNavItems[0].href,
    });

    render(<UsagesNavigation description='Usage description' />);

    expect(screen.getAllByTestId('action-tile')).toHaveLength(4);

    const actionTileProps = mockActionTile.mock.calls.map((call) => call[0] as ActionTileProps);
    const activeTiles = actionTileProps.filter((props) => props.href === mockUsagesNavItems[0].href);
    const inactiveTiles = actionTileProps.filter((props) => props.href === mockUsagesNavItems[1].href);

    expect(activeTiles).toHaveLength(2);
    expect(inactiveTiles).toHaveLength(2);
    activeTiles.forEach((props) => {
      expect(props).toMatchObject({
        ariaLabel: 'Usage',
        href: '/usages/use',
        interaction: 'current-page',
        size: 'md',
        title: 'Usage',
        tone: 'active',
      });
    });
    inactiveTiles.forEach((props) => {
      expect(props).toMatchObject({
        ariaLabel: 'Edit',
        href: '/usages/edit',
        interaction: 'normal',
        size: 'md',
        title: 'Edit',
        tone: 'default',
      });
    });
  });
});
