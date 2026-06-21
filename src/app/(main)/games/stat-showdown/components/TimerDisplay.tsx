'use client';

import { cn } from '@/lib/design';

type TimerDisplayProps = {
  timeLeft: number;
  formattedTime: string;
  isWarning: boolean;
  /** When false, timer is paused and visually muted */
  started?: boolean;
  /** Feedback text shown after a correct/wrong choice, e.g. "+1s" or "-5s" */
  feedbackText?: string | null;
  /** 'correct' = green, 'wrong' = red */
  feedbackType?: 'correct' | 'wrong' | null;
};

/**
 * Countdown timer display for Blitz mode.
 * Shows the clock icon + time, optionally with feedback badge.
 * Turns red when time is low (≤10 seconds).
 */
export default function TimerDisplay({
  timeLeft: _timeLeft,
  formattedTime,
  isWarning,
  started = true,
  feedbackText,
  feedbackType,
}: TimerDisplayProps) {
  return (
    <div className='flex items-center justify-center gap-2 text-center'>
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xl font-bold',
          !started
            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            : isWarning
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

      {/* Feedback badge */}
      {feedbackText && feedbackType && (
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-sm font-bold',
            feedbackType === 'correct'
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {feedbackText}
        </span>
      )}
    </div>
  );
}
