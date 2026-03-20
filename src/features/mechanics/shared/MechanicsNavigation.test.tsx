import React from 'react';
import { render } from '@testing-library/react';

import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import UsagesNavigation from '@/features/usages/shared/UsagesNavigation';

import MechanicsNavigation from './MechanicsNavigation';

const mockMechanicsNavItems = [
  {
    id: 'object',
    label: '物体',
    href: '/mechanics/object',
    iconSrc: '/images/object.png',
    iconAlt: '物体',
  },
  {
    id: 'move',
    label: '移动',
    href: '/mechanics/move',
    iconSrc: '/images/move.png',
    iconAlt: '移动',
  },
] as const;

const mockUsagesNavItems = [
  {
    id: 'use',
    label: '使用指南',
    href: '/usages/use',
    iconSrc: '/images/use.png',
    iconAlt: '使用指南',
  },
  {
    id: 'edit',
    label: '编辑指南',
    href: '/usages/edit',
    iconSrc: '/images/edit.png',
    iconAlt: '编辑指南',
  },
] as const;

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
      label: '物体',
      href: '/mechanics/object',
      iconSrc: '/images/object.png',
      iconAlt: '物体',
    },
    {
      id: 'move',
      label: '移动',
      href: '/mechanics/move',
      iconSrc: '/images/move.png',
      iconAlt: '移动',
    },
  ],
}));

jest.mock('../../usages/sections', () => ({
  USAGES_NAV_ITEMS: [
    {
      id: 'use',
      label: '使用指南',
      href: '/usages/use',
      iconSrc: '/images/use.png',
      iconAlt: '使用指南',
    },
    {
      id: 'edit',
      label: '编辑指南',
      href: '/usages/edit',
      iconSrc: '/images/edit.png',
      iconAlt: '编辑指南',
    },
  ],
}));

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
    mockedUseMobile.mockReturnValue(false);
  });

  it('renders active mechanics tiles as current-page and non-interactive', () => {
    mockedUseNavigationTabs.mockReturnValue({
      isActive: (href: string) => href === mockMechanicsNavItems[0].href,
      items: [] as const,
      pathname: mockMechanicsNavItems[0].href,
    });

    const { container } = render(<MechanicsNavigation description='机制说明' />);

    const activeLink = container.querySelector(`a[href="${mockMechanicsNavItems[0].href}"]`);
    const inactiveLink = container.querySelector(`a[href="${mockMechanicsNavItems[1].href}"]`);

    expect(activeLink).toBeInTheDocument();
    expect(inactiveLink).toBeInTheDocument();
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveAttribute('aria-disabled', 'true');
    expect(activeLink).toHaveAttribute('tabindex', '-1');
    expect(activeLink).toHaveClass('pointer-events-none', 'cursor-not-allowed', 'bg-blue-600');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
    expect(inactiveLink).not.toHaveAttribute('aria-disabled');
  });

  it('renders active usages tiles as current-page and non-interactive', () => {
    mockedUseNavigationTabs.mockReturnValue({
      isActive: (href: string) => href === mockUsagesNavItems[0].href,
      items: [] as const,
      pathname: mockUsagesNavItems[0].href,
    });

    const { container } = render(<UsagesNavigation description='使用说明' />);

    const activeLink = container.querySelector(`a[href="${mockUsagesNavItems[0].href}"]`);
    const inactiveLink = container.querySelector(`a[href="${mockUsagesNavItems[1].href}"]`);

    expect(activeLink).toBeInTheDocument();
    expect(inactiveLink).toBeInTheDocument();
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveAttribute('aria-disabled', 'true');
    expect(activeLink).toHaveAttribute('tabindex', '-1');
    expect(activeLink).toHaveClass('pointer-events-none', 'cursor-not-allowed', 'bg-blue-600');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
    expect(inactiveLink).not.toHaveAttribute('aria-disabled');
  });
});
