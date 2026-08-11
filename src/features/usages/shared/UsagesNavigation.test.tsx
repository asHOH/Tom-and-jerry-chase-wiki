import { render, screen } from '@testing-library/react';

import type { SectionNavigationShellProps } from '@/components/ui/SectionNavigationShell';

import UsagesNavigation from './UsagesNavigation';

const mockUsagesNavItems = [
  {
    id: 'use',
    label: 'Usage',
    href: '/usages/use',
    iconSrc: '/images/use.png',
    iconAlt: 'Usage',
  },
] as const;

const mockSectionNavigationShell = jest.fn();

jest.mock('../sections', () => ({
  USAGES_NAV_ITEMS: [
    {
      id: 'use',
      label: 'Usage',
      href: '/usages/use',
      iconSrc: '/images/use.png',
      iconAlt: 'Usage',
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

describe('UsagesNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures the shared shell with always-on bottom navigation', () => {
    render(<UsagesNavigation description='Usage description'>Usage content</UsagesNavigation>);

    expect(screen.getByText('网站说明')).toBeInTheDocument();
    expect(screen.getByText('Usage description')).toBeInTheDocument();
    expect(screen.getByText('Usage content')).toBeInTheDocument();

    const props = mockSectionNavigationShell.mock.calls[0]?.[0] as SectionNavigationShellProps;
    expect(props).toMatchObject({
      title: '网站说明',
      description: 'Usage description',
      items: mockUsagesNavItems,
      bottomNavigation: 'always',
    });
  });
});
