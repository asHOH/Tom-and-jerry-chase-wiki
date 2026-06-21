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
        ⏱️ {formattedTime}
      </div>
    </div>
  );
}
