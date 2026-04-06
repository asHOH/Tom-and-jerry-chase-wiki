import { render } from '@testing-library/react';

import {
  BouncingDots,
  ProgressBar,
  PulsingCircle,
  RippleAnimation,
  SpinningBars,
  TypingDots,
  WaveAnimation,
} from './LoadingAnimations';

describe('LoadingAnimations', () => {
  it('renders three bouncing dots and changes dot sizing across variants', () => {
    const { container: defaultContainer } = render(<BouncingDots />);
    const { container: largeContainer } = render(<BouncingDots size='lg' />);

    const defaultRoot = defaultContainer.firstElementChild as HTMLElement;
    const largeRoot = largeContainer.firstElementChild as HTMLElement;

    expect(defaultRoot.childElementCount).toBe(3);
    expect(largeRoot.childElementCount).toBe(3);
    expect((largeRoot.children[0] as HTMLElement).className).not.toBe(
      (defaultRoot.children[0] as HTMLElement).className
    );
  });

  it('renders a single pulsing circle', () => {
    const { container } = render(<PulsingCircle />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.childElementCount).toBe(1);
  });

  it('renders two ripple rings and one center circle', () => {
    const { container } = render(<RippleAnimation />);

    const rippleContainer = container.querySelector('.relative > .relative') as HTMLElement | null;
    expect(rippleContainer?.childElementCount).toBe(3);
  });

  it('renders a single spinning bar wrapper', () => {
    const { container } = render(<SpinningBars />);

    const spinnerContainer = container.querySelector('.relative') as HTMLElement | null;
    expect(spinnerContainer?.childElementCount).toBe(1);
  });

  it('renders five wave bars', () => {
    const { container } = render(<WaveAnimation />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.childElementCount).toBe(5);
  });

  it('renders three typing dots', () => {
    const { container } = render(<TypingDots />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.childElementCount).toBe(3);
  });

  it('renders the requested progress width and clamps out-of-range values', () => {
    const { container: midContainer } = render(<ProgressBar progress={50} />);
    const { container: lowContainer } = render(<ProgressBar progress={-10} />);
    const { container: highContainer } = render(<ProgressBar progress={150} />);

    const midBar = midContainer.firstElementChild?.firstElementChild as HTMLElement;
    const lowBar = lowContainer.firstElementChild?.firstElementChild as HTMLElement;
    const highBar = highContainer.firstElementChild?.firstElementChild as HTMLElement;

    expect(midBar).toHaveStyle('width: 50%');
    expect(lowBar).toHaveStyle('width: 0%');
    expect(highBar).toHaveStyle('width: 100%');
  });

  it('disables pulse animation on the progress indicator when animated is false', () => {
    const { container } = render(<ProgressBar animated={false} />);

    const progressBar = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(progressBar.className).not.toContain('animate-pulse');
  });
});
