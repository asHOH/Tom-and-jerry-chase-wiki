import clsx from 'clsx';

import { BouncingDots, RippleAnimation, SpinningBars } from './LoadingAnimations';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
  variant?: 'spinner' | 'dots' | 'ripple';
}

export default function LoadingSpinner({
  size = 'md',
  message = '加载中...',
  className = '',
  variant = 'spinner',
}: LoadingSpinnerProps) {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const renderAnimation = () => {
    switch (variant) {
      case 'dots':
        return <BouncingDots size={size} />;
      case 'ripple':
        return <RippleAnimation size={size} />;
      case 'spinner':
      default:
        return <SpinningBars size={size} />;
    }
  };

  return (
    <div className={clsx('flex items-center justify-center space-x-3', className)}>
      {renderAnimation()}
      {message && (
        <span
          className={clsx(
            'animate-fadeInUp text-gray-600 dark:text-gray-300',
            textSizeClasses[size]
          )}
        >
          {message}
        </span>
      )}
    </div>
  );
}
