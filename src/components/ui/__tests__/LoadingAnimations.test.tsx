/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import { render } from '@testing-library/react';
import {
  BouncingDots,
  PulsingCircle,
  RippleAnimation,
  SpinningBars,
  WaveAnimation,
  TypingDots,
  ProgressBar,
} from '../LoadingAnimations';

describe('LoadingAnimations', () => {
  describe('BouncingDots', () => {
    it('renders with default props', () => {
      const { container } = render(<BouncingDots />);
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    it('renders with different sizes', () => {
      const { container } = render(<BouncingDots size='lg' />);
      const dots = container.querySelectorAll('.w-3.h-3');
      expect(dots).toHaveLength(3);
    });
  });

  describe('PulsingCircle', () => {
    it('renders with pulse animation', () => {
      const { container } = render(<PulsingCircle />);
      const circle = container.querySelector('.animate-pulse');
      expect(circle).toBeInTheDocument();
    });
  });

  describe('RippleAnimation', () => {
    it('renders with ping animations', () => {
      const { container } = render(<RippleAnimation />);
      const ripples = container.querySelectorAll('.animate-ping');
      expect(ripples).toHaveLength(2);
    });
  });

  describe('SpinningBars', () => {
    it('renders with spin animation', () => {
      const { container } = render(<SpinningBars />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('WaveAnimation', () => {
    it('renders with multiple bars', () => {
      const { container } = render(<WaveAnimation />);
      const bars = container.querySelectorAll('.animate-pulse');
      expect(bars).toHaveLength(5);
    });
  });

  describe('TypingDots', () => {
    it('renders three typing dots', () => {
      const { container } = render(<TypingDots />);
      const dots = container.querySelectorAll('.rounded-full');
      expect(dots).toHaveLength(3);
    });
  });

  describe('ProgressBar', () => {
    it('renders with correct progress width', () => {
      const { container } = render(<ProgressBar progress={50} />);
      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).toHaveStyle('width: 50%');
    });

    it('clamps progress to 0-100 range', () => {
      const { container: container1 } = render(<ProgressBar progress={-10} />);
      const progressBar1 = container1.querySelector('.bg-blue-500');
      expect(progressBar1).toHaveStyle('width: 0%');

      const { container: container2 } = render(<ProgressBar progress={150} />);
      const progressBar2 = container2.querySelector('.bg-blue-500');
      expect(progressBar2).toHaveStyle('width: 100%');
    });

    it('renders without animation when animated is false', () => {
      const { container } = render(<ProgressBar animated={false} />);
      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).not.toHaveClass('animate-pulse');
    });
  });
});
