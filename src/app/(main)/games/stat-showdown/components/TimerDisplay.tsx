'use client';

import { cn } from '@/lib/design';
import { ClockIcon } from '@/components/icons/CommonIcons';

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
            ? 'bg-surface-muted text-gray-400 dark:text-gray-500'
            : isWarning
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-surface-muted text-gray-700 dark:text-gray-200'
        )}
      >
        <ClockIcon className='h-5 w-5' strokeWidth={2} />
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
