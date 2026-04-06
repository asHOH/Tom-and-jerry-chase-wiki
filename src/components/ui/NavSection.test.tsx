import { render, screen } from '@testing-library/react';

import HomePageSection from './NavSection';

type MockFactionButtonProps = {
  title?: string;
  description: string;
  href?: string;
  ariaLabel: string;
  preload?: boolean;
};

const mockFactionButton = jest.fn();

jest.mock('usehooks-ts', () => ({
  useIntersectionObserver: jest.fn(() => [jest.fn(), true] as const),
}));

jest.mock('@/components/ui/FactionButton', () => ({
  __esModule: true,
  default: function MockFactionButton(props: MockFactionButtonProps) {
    mockFactionButton(props);
    return <div data-testid='faction-button'>{props.title}</div>;
  },
}));

jest.mock('@/components/ui/FactionButtonGroup', () => ({
  __esModule: true,
  default: function MockFactionButtonGroup({ children }: { children: React.ReactNode }) {
    return <div data-testid='faction-button-group'>{children}</div>;
  },
}));

describe('HomePageSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes every button through with preload enabled and inserts the 4-item wrap spacer', () => {
    const buttons = [
      {
        imageSrc: '/images/one.png',
        imageAlt: 'One',
        title: 'One',
        description: 'Description one',
        href: '/one',
        ariaLabel: 'Description one',
      },
      {
        imageSrc: '/images/two.png',
        imageAlt: 'Two',
        title: 'Two',
        description: 'Description two',
        href: '/two',
        ariaLabel: 'Description two',
      },
      {
        imageSrc: '/images/three.png',
        imageAlt: 'Three',
        title: 'Three',
        description: 'Description three',
        href: '/three',
        ariaLabel: 'Description three',
      },
      {
        imageSrc: '/images/four.png',
        imageAlt: 'Four',
        title: 'Four',
        description: 'Description four',
        href: '/four',
        ariaLabel: 'Description four',
      },
    ];

    render(<HomePageSection title='Home section' buttons={buttons} />);

    const group = screen.getByTestId('faction-button-group');

    expect(screen.getByRole('heading', { name: 'Home section' })).toBeInTheDocument();
    expect(screen.getAllByTestId('faction-button')).toHaveLength(4);
    expect(mockFactionButton.mock.calls.map((call) => call[0])).toEqual(
      buttons.map((button) => ({
        ...button,
        preload: true,
      }))
    );
    expect(group.childElementCount).toBe(5);
    expect(group.children[2]?.textContent).toBe('');
  });

  it('omits the section heading when title is not provided', () => {
    render(
      <HomePageSection
        buttons={[
          {
            imageSrc: '/images/one.png',
            imageAlt: 'One',
            title: 'One',
            description: 'Description one',
            href: '/one',
            ariaLabel: 'Description one',
          },
        ]}
      />
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByTestId('faction-button')).toHaveTextContent('One');
  });
});
