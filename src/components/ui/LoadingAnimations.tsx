import React from 'react';
import clsx from 'clsx';

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Bouncing dots animation
 */
export function BouncingDots({ size = 'md', className = '' }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dotClass = clsx(
    'bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce',
    sizeClasses[size]
  );

  return (
    <div className={clsx('flex items-center justify-center space-x-1', className)}>
      <div className={clsx(dotClass, '[animation-delay:-0.3s]')}></div>
      <div className={clsx(dotClass, '[animation-delay:-0.15s]')}></div>
      <div className={dotClass}></div>
    </div>
  );
}

/**
 * Pulsing circle animation
 */
export function PulsingCircle({ size = 'md', className = '' }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse',
          sizeClasses[size]
        )}
      ></div>
    </div>
  );
}

/**
 * Ripple effect animation
 */
export function RippleAnimation({ size = 'md', className = '' }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={clsx('relative flex items-center justify-center', className)}>
      <div className={clsx('relative', sizeClasses[size])}>
        <div className='absolute inset-0 rounded-full border-2 border-blue-500 dark:border-blue-400 animate-ping'></div>
        <div className='absolute inset-2 rounded-full border-2 border-blue-500 dark:border-blue-400 animate-ping [animation-delay:0.2s]'></div>
        <div className='absolute inset-4 rounded-full bg-blue-500 dark:bg-blue-400'></div>
      </div>
    </div>
  );
}

/**
 * Spinning bars animation
 */
export function SpinningBars({ size = 'md', className = '' }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className={clsx('relative', sizeClasses[size])}>
        <div className='absolute inset-0 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin'></div>
      </div>
    </div>
  );
}

/**
 * Wave animation
 */
export function WaveAnimation({ size = 'md', className = '' }: LoadingAnimationProps) {
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const widthClasses = {
    sm: 'w-1',
    md: 'w-1.5',
    lg: 'w-2',
  };

  const barClass = clsx(
    'bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse',
    heightClasses[size],
    widthClasses[size]
  );

  return (
    <div className={clsx('flex items-end justify-center space-x-1', className)}>
      <div
        className={clsx(barClass, '[animation-delay:-0.4s]')}
        style={{ animationDuration: '1.2s' }}
      ></div>
      <div
        className={clsx(barClass, '[animation-delay:-0.3s]')}
        style={{ animationDuration: '1.0s' }}
      ></div>
      <div
        className={clsx(barClass, '[animation-delay:-0.2s]')}
        style={{ animationDuration: '0.8s' }}
      ></div>
      <div
        className={clsx(barClass, '[animation-delay:-0.1s]')}
        style={{ animationDuration: '1.0s' }}
      ></div>
      <div className={barClass} style={{ animationDuration: '1.2s' }}></div>
    </div>
  );
}

/**
 * Skeleton shimmer animation
 */
export function SkeletonShimmer({ className = '' }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse', className)}>
      <div className='bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded'></div>
    </div>
  );
}

/**
 * Typing dots animation
 */
export function TypingDots({ size = 'md', className = '' }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const dotClass = clsx('bg-gray-500 dark:bg-gray-400 rounded-full', sizeClasses[size]);

  return (
    <div className={clsx('flex items-center space-x-1', className)}>
      <div
        className={clsx(
          dotClass,
          'animate-[typing_1.4s_infinite_ease-in-out] [animation-delay:0s]'
        )}
      ></div>
      <div
        className={clsx(
          dotClass,
          'animate-[typing_1.4s_infinite_ease-in-out] [animation-delay:0.2s]'
        )}
      ></div>
      <div
        className={clsx(
          dotClass,
          'animate-[typing_1.4s_infinite_ease-in-out] [animation-delay:0.4s]'
        )}
      ></div>
    </div>
  );
}

/**
 * Progress bar animation
 */
export function ProgressBar({
  progress = 0,
  animated = true,
  className = '',
}: {
  progress?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx('w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2', className)}>
      <div
        className={clsx(
          'h-2 bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300',
          animated && 'animate-pulse'
        )}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      ></div>
    </div>
  );
}
