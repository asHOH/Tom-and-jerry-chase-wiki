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

/**
 * Displays current and best streak.
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
      <svg
        className={cn('text-orange-500', size === 'sm' ? 'h-4 w-4' : 'h-6 w-6')}
        fill='currentColor'
        viewBox='0 0 24 24'
        aria-hidden='true'
      >
        <path d='M12 23c-1.66 0-3.2-.7-4.3-1.8C6.6 20 6 18.5 6 16.8c0-1.5.4-2.8 1.2-4 .8-1.2 1.9-2.3 3.1-3.3.6-.5 1.1-.9 1.7-1.4v.2c1 3 2.4 5.6 4.2 7.7.6.8 1.2 1.8 1.2 2.8 0 1.7-.6 3.2-1.8 4.3C15.2 22.3 13.7 23 12 23z' />
        <path
          d='M12 3v2c-3.87 0-7 3.13-7 7 0 1.1-.9 2-2 2s-2-.9-2-2c0-6.08 4.92-11 11-11z'
          opacity='.6'
        />
        <path
          d='M12 1v2c-4.97 0-9 4.03-9 9 0 .55-.45 1-1 1s-1-.45-1-1C1 6.48 5.48 2 11 2h1z'
          opacity='.3'
        />
      </svg>
      <span className='font-semibold'>
        {current} {label}
      </span>
      {best !== undefined && best > 0 && (
        <span className='text-gray-500 dark:text-gray-400'>(最佳: {best})</span>
      )}
    </div>
  );
}
