import React from 'react';
import { render, screen } from '@testing-library/react';

import { TOOL_NAV_ITEMS } from '@/constants/navigation';

import ToolGrid from './ToolGrid';

jest.mock('usehooks-ts', () => ({
  useIntersectionObserver: jest.fn(() => [jest.fn(), true] as const),
}));

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({ isEditMode: false }),
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

describe('ToolGrid', () => {
  it('renders the real navigation sections and tool links', () => {
    render(<ToolGrid description='Tool page description' />);

    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });

    expect(screen.getByRole('heading', { level: 1, name: '工具栏' })).toBeInTheDocument();
    expect(screen.getByText('Tool page description')).toBeInTheDocument();
    expect(sectionHeadings).toHaveLength(5);
    expect(screen.getByTestId('feedback-section')).toBeInTheDocument();
    expect(screen.getByTestId('change-logs')).toBeInTheDocument();

    const visibleToolItems = TOOL_NAV_ITEMS.filter((item) =>
      [
        'usage-use',
        'usage-edit',
        'ranks',
        'win-rates',
        'special-skill-advices',
        'traitCollection',
        'random',
        'fixtures',
        'achievements',
      ].includes(item.id)
    );

    visibleToolItems.forEach((item) => {
      expect(screen.getByRole('link', { name: item.description })).toHaveAttribute(
        'href',
        item.href
      );
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });
});
