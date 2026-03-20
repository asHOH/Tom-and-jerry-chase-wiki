import { render, screen } from '@testing-library/react';

import HomePageSection from './NavSection';

type MockFactionButtonProps = {
  title?: string;
  description: string;
  href?: string;
  ariaLabel: string;
  preload?: boolean;
};

jest.mock('usehooks-ts', () => ({
  useIntersectionObserver: jest.fn(() => [jest.fn(), true] as const),
}));

jest.mock('@/components/ui/FactionButton', () => ({
  __esModule: true,
  default: function MockFactionButton({
    title,
    description,
    href,
    ariaLabel,
    preload,
  }: MockFactionButtonProps) {
    return (
      <div
        data-testid='faction-button'
        data-title={title ?? ''}
        data-description={description}
        data-href={href ?? ''}
        data-aria-label={ariaLabel}
        data-preload={preload ? 'true' : 'false'}
      />
    );
  },
}));

describe('HomePageSection', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('passes preload to every faction button and keeps the 4-item wrap spacer', () => {
    const buttons = [
      {
        imageSrc: '/images/one.png',
        imageAlt: '一号',
        title: '一号',
        description: '说明一',
        href: '/one',
        ariaLabel: '说明一',
      },
      {
        imageSrc: '/images/two.png',
        imageAlt: '二号',
        title: '二号',
        description: '说明二',
        href: '/two',
        ariaLabel: '说明二',
      },
      {
        imageSrc: '/images/three.png',
        imageAlt: '三号',
        title: '三号',
        description: '说明三',
        href: '/three',
        ariaLabel: '说明三',
      },
      {
        imageSrc: '/images/four.png',
        imageAlt: '四号',
        title: '四号',
        description: '说明四',
        href: '/four',
        ariaLabel: '说明四',
      },
    ];

    const { container } = render(<HomePageSection title='主页面块' buttons={buttons} />);

    const renderedButtons = screen.getAllByTestId('faction-button');
    const wrapSpacer = container.querySelector('.hidden.h-0.w-full.sm\\:block');

    expect(screen.getByText('主页面块')).toBeInTheDocument();
    expect(renderedButtons).toHaveLength(4);
    expect(renderedButtons[0]).toHaveAttribute('data-title', '一号');
    expect(renderedButtons[1]).toHaveAttribute('data-title', '二号');
    expect(renderedButtons[2]).toHaveAttribute('data-title', '三号');
    expect(renderedButtons[3]).toHaveAttribute('data-title', '四号');
    renderedButtons.forEach((button) => {
      expect(button).toHaveAttribute('data-preload', 'true');
    });
    expect(wrapSpacer).toBeInTheDocument();
  });

  it('omits the section heading when title is not provided', () => {
    render(
      <HomePageSection
        buttons={[
          {
            imageSrc: '/images/one.png',
            imageAlt: '一号',
            title: '一号',
            description: '说明一',
            href: '/one',
            ariaLabel: '说明一',
          },
        ]}
      />
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByTestId('faction-button')).toHaveAttribute('data-title', '一号');
  });
});
