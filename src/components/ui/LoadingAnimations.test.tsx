import { render } from '@testing-library/react';

import { ProgressBar } from './LoadingAnimations';

describe('LoadingAnimations', () => {
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
