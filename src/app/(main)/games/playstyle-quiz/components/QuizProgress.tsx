'use client';

import { cn } from '@/lib/design';

type QuizProgressProps = {
  current: number; // 0-based
  total: number;
};

/**
 * Progress indicator showing current question number and a progress bar.
 */
export default function QuizProgress({ current, total }: QuizProgressProps) {
  const percentage = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className='w-full space-y-2'>
      <div className='text-center text-sm text-gray-500 dark:text-gray-400'>
        {current + 1} / {total}
      </div>
      <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            'bg-blue-500 dark:bg-blue-400'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
