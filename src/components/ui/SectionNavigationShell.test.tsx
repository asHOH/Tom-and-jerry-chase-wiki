import React from 'react';
import { render, screen } from '@testing-library/react';

import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import type { ActionTileProps } from '@/components/ui/ActionTile';

import SectionNavigationShell, { type SectionNavigationItem } from './SectionNavigationShell';

const mockItems = [
  {
    label: 'First',
    href: '/sections/first',
    iconSrc: '/images/first.png',
    iconAlt: 'First icon',
  },
  {
    label: 'Second',
    href: '/sections/second',
    iconSrc: '/images/second.png',
    iconAlt: 'Second icon',
  },
] as const satisfies readonly SectionNavigationItem[];

const mockActionTile = jest.fn();

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: jest.fn(),
}));

jest.mock('@/hooks/useNavigationTabs', () => ({
  useNavigationTabs: jest.fn(),
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

function setActiveHref(activeHref?: string) {
  mockedUseNavigationTabs.mockReturnValue({
    isActive: (href: string) => href === activeHref,
    items: [] as const,
    pathname: activeHref ?? '/sections',
  });
}

describe('SectionNavigationShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseMobile.mockReturnValue(false);
    setActiveHref();
  });

  it('renders shared content and repeats navigation after an active section', () => {
    setActiveHref(mockItems[0].href);

    render(
      <SectionNavigationShell
        title='Section title'
        description='Section description'
        items={mockItems}
        bottomNavigation='when-active'
      >
        <p>Section content</p>
      </SectionNavigationShell>
    );

    expect(screen.getByText('Section title')).toBeInTheDocument();
    expect(screen.getByText('Section description')).toBeInTheDocument();
    expect(screen.getByText('Section content')).toBeInTheDocument();
    expect(screen.getAllByTestId('action-tile')).toHaveLength(mockItems.length * 2);

    const actionTileProps = mockActionTile.mock.calls.map((call) => call[0] as ActionTileProps);
    const activeTiles = actionTileProps.filter((props) => props.href === mockItems[0].href);
    const inactiveTiles = actionTileProps.filter((props) => props.href === mockItems[1].href);

    expect(activeTiles).toHaveLength(2);
    expect(inactiveTiles).toHaveLength(2);
    activeTiles.forEach((props) => {
      expect(props).toMatchObject({
        ariaLabel: 'First',
        href: '/sections/first',
        interaction: 'current-page',
        size: 'md',
        title: 'First',
        tone: 'active',
      });
    });
    inactiveTiles.forEach((props) => {
      expect(props).toMatchObject({
        ariaLabel: 'Second',
        href: '/sections/second',
        interaction: 'normal',
        size: 'md',
        title: 'Second',
        tone: 'default',
      });
    });
  });

  it('omits conditional bottom navigation when no section is active', () => {
    render(
      <SectionNavigationShell
        title='Section title'
        items={mockItems}
        bottomNavigation='when-active'
      />
    );

    expect(screen.getAllByTestId('action-tile')).toHaveLength(mockItems.length);
  });

  it('preserves always-on bottom navigation when no section is active', () => {
    render(
      <SectionNavigationShell title='Section title' items={mockItems} bottomNavigation='always' />
    );

    expect(screen.getAllByTestId('action-tile')).toHaveLength(mockItems.length * 2);
  });

  it('uses compact navigation tiles on mobile', () => {
    mockedUseMobile.mockReturnValue(true);

    render(
      <SectionNavigationShell title='Section title' items={mockItems} bottomNavigation='always' />
    );

    const actionTileProps = mockActionTile.mock.calls.map((call) => call[0] as ActionTileProps);
    actionTileProps.forEach((props) => {
      expect(props.size).toBe('sm');
    });
  });
});
