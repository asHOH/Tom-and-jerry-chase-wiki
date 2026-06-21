'use client';

import { cn } from '@/lib/design';

type GuessHistoryProps = {
  guesses: string[];
  correctGuessIndex: number | null;
};

/**
 * Displays the list of previous guesses with emoji indicators.
 * 🟨 = wrong guess, 🟩 = correct guess.
 */
export default function GuessHistory({ guesses, correctGuessIndex }: GuessHistoryProps) {
  if (guesses.length === 0) return null;

  return (
    <div className='space-y-2'>
      <h3 className='text-center text-sm font-medium text-gray-500 dark:text-gray-400'>
        已猜 ({guesses.length})
      </h3>
      <div className='flex flex-wrap justify-center gap-2'>
        {guesses.map((guess, index) => {
          const isCorrect = correctGuessIndex !== null && index === correctGuessIndex;
          return (
            <span
              key={index}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
                isCorrect
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
              )}
            >
              {isCorrect ? '🟩' : '🟨'} {guess}
            </span>
          );
        })}
      </div>
    </div>
  );
}
