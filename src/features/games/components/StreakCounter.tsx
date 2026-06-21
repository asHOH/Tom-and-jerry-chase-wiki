'use client';

import { cn } from '@/lib/design';

type StreakCounterProps = {
  current: number;
  best?: number;
  label?: string;
  size?: 'sm' | 'md';
};

const sizeClasses = {
  sm: 'text-sm gap-1',
  md: 'text-base gap-2',
} as const;

const flameSizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
} as const;

/**
 * Displays current and best streak with a flame icon.
 * Used by Guess Character (daily streaks) and Stat Showdown (session streaks).
 */
export default function StreakCounter({
  current,
  best,
  label = '连胜',
  size = 'md',
}: StreakCounterProps) {
  if (current === 0 && (best === undefined || best === 0)) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-center', sizeClasses[size])}>
      <span className={cn('inline-block', flameSizeClasses[size])} aria-hidden='true'>
        🔥
      </span>
      <span className='font-semibold'>
        {current} {label}
      </span>
      {best !== undefined && best > 0 && (
        <span className='text-gray-500 dark:text-gray-400'>(最佳: {best})</span>
      )}
    </div>
  );
}
