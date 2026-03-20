import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import { TOOL_NAV_ITEMS } from '@/constants/navigation';

import ToolGrid from './ToolGrid';

type HomePageSectionProps = {
  title?: string;
  buttons: Array<{
    imageSrc: string;
    imageAlt: string;
    title?: string;
    description: string;
    href: string;
    ariaLabel: string;
  }>;
};

const recordedSections: HomePageSectionProps[] = [];

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: jest.fn(() => false),
}));

jest.mock('@/components/ui/NavSection', () => ({
  __esModule: true,
  default: function MockHomePageSection(props: HomePageSectionProps) {
    recordedSections.push(props);
    return <section data-testid='tool-section'>{props.title ?? 'untitled'}</section>;
  },
}));

jest.mock('@/components/ui/FeedbackSection', () => ({
  __esModule: true,
  default: function MockFeedbackSection() {
    return <div data-testid='feedback-section' />;
  },
}));

jest.mock('@/components/ui/ChangeLogs', () => ({
  __esModule: true,
  default: function MockChangeLogs() {
    return <div data-testid='change-logs' />;
  },
}));

jest.mock('@/components/ui/PageTitle', () => ({
  __esModule: true,
  default: function MockPageTitle({ children }: { children: ReactNode }) {
    return <h1>{children}</h1>;
  },
}));

jest.mock('@/components/ui/PageDescription', () => ({
  __esModule: true,
  default: function MockPageDescription({ children }: { children: ReactNode }) {
    return <p>{children}</p>;
  },
}));

describe('ToolGrid', () => {
  beforeEach(() => {
    recordedSections.length = 0;
  });

  it('maps tool navigation items into the current section/button layout contract', () => {
    render(<ToolGrid description='工具页说明' />);

    const usageItems = TOOL_NAV_ITEMS.filter((item) =>
      ['usage-use', 'usage-edit'].includes(item.id)
    );
    const queryItems = TOOL_NAV_ITEMS.filter((item) =>
      ['ranks', 'win-rates', 'special-skill-advices', 'traitCollection'].includes(item.id)
    );
    const buildingItems = TOOL_NAV_ITEMS.filter((item) =>
      ['fixtures', 'achievements'].includes(item.id)
    );

    expect(screen.getByText('工具页说明')).toBeInTheDocument();
    expect(screen.getAllByTestId('tool-section')).toHaveLength(3);
    expect(screen.getByTestId('feedback-section')).toBeInTheDocument();
    expect(screen.getByTestId('change-logs')).toBeInTheDocument();

    expect(recordedSections).toHaveLength(3);
    expect(recordedSections[0]).toMatchObject({
      title: '使用指南',
      buttons: usageItems.map((item) => ({
        imageSrc: item.iconSrc,
        imageAlt: item.iconAlt,
        title: item.label,
        description: item.description,
        href: item.href,
        ariaLabel: item.description,
      })),
    });
    expect(recordedSections[1]).toMatchObject({
      title: '查询工具',
      buttons: queryItems.map((item) => ({
        imageSrc: item.iconSrc,
        imageAlt: item.iconAlt,
        title: item.label,
        description: item.description,
        href: item.href,
        ariaLabel: item.description,
      })),
    });
    expect(recordedSections[2]).toMatchObject({
      title: '建设中界面',
      buttons: buildingItems.map((item) => ({
        imageSrc: item.iconSrc,
        imageAlt: item.iconAlt,
        title: item.label,
        description: item.description,
        href: item.href,
        ariaLabel: item.description,
      })),
    });
  });
});
