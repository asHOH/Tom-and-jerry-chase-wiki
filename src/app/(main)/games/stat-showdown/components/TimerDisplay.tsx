'use client';

import { cn } from '@/lib/design';

type TimerDisplayProps = {
  timeLeft: number;
  formattedTime: string;
  isWarning: boolean;
};

/**
 * Countdown timer display for Blitz mode.
 * Turns red when time is low (≤10 seconds).
 */
export default function TimerDisplay({
  timeLeft: _timeLeft,
  formattedTime,
  isWarning,
}: TimerDisplayProps) {
  return (
    <div className='text-center'>
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xl font-bold',
          isWarning
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
        )}
      >
        <svg
          className='h-5 w-5'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={2}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        {formattedTime}
      </div>
    </div>
  );
}
