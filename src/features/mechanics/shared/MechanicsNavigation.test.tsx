import { render, screen } from '@testing-library/react';

import type { SectionNavigationShellProps } from '@/components/ui/SectionNavigationShell';

import MechanicsNavigation from './MechanicsNavigation';

const mockMechanicsNavItems = [
  {
    id: 'object',
    label: 'Object',
    href: '/mechanics/object',
    iconSrc: '/images/object.png',
    iconAlt: 'Object',
  },
] as const;

const mockSectionNavigationShell = jest.fn();

jest.mock('../sections', () => ({
  MECHANICS_NAV_ITEMS: [
    {
      id: 'object',
      label: 'Object',
      href: '/mechanics/object',
      iconSrc: '/images/object.png',
      iconAlt: 'Object',
    },
  ],
}));

jest.mock('@/components/ui/SectionNavigationShell', () => ({
  __esModule: true,
  default: function MockSectionNavigationShell(props: SectionNavigationShellProps) {
    mockSectionNavigationShell(props);
    return (
      <div>
        <span>{props.title}</span>
        <span>{props.description}</span>
        {props.children}
      </div>
    );
  },
}));

describe('MechanicsNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures the shared shell with conditional bottom navigation', () => {
    render(
      <MechanicsNavigation description='Mechanics description'>
        Mechanics content
      </MechanicsNavigation>
    );

    expect(screen.getByText('局内机制')).toBeInTheDocument();
    expect(screen.getByText('Mechanics description')).toBeInTheDocument();
    expect(screen.getByText('Mechanics content')).toBeInTheDocument();

    const props = mockSectionNavigationShell.mock.calls[0]?.[0] as SectionNavigationShellProps;
    expect(props).toMatchObject({
      title: '局内机制',
      description: 'Mechanics description',
      items: mockMechanicsNavItems,
      bottomNavigation: 'when-active',
    });
  });
});
