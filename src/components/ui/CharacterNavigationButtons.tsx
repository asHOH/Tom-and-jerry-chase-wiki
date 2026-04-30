'use client';

import { m } from 'motion/react';

import { cn } from '@/lib/design';
import { useCharacterNavigation } from '@/features/characters/hooks/useCharacterNavigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/CommonIcons';

interface CharacterNavigationButtonsProps {
  currentCharacterId: string;
  className?: string;
}

export default function CharacterNavigationButtons({
  currentCharacterId,
  className = '',
}: CharacterNavigationButtonsProps) {
  const { previousId, nextId, navigateToPrevious, navigateToNext, currentIndex, totalCharacters } =
    useCharacterNavigation(currentCharacterId);

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <m.button
        onClick={navigateToPrevious}
        disabled={!previousId}
        className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
          previousId
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        )}
        whileHover={previousId ? { scale: 1.05 } : {}}
        whileTap={previousId ? { scale: 0.95 } : {}}
      >
        <ChevronLeftIcon className='h-4 w-4' />
        <span className='hidden sm:inline'>{previousId ?? '上一位'}</span>
      </m.button>

      <div className='px-2 text-sm text-gray-600 dark:text-gray-400'>
        {currentIndex + 1} / {totalCharacters}
      </div>

      <m.button
        onClick={navigateToNext}
        disabled={!nextId}
        className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
          nextId
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        )}
        whileHover={nextId ? { scale: 1.05 } : {}}
        whileTap={nextId ? { scale: 0.95 } : {}}
      >
        <span className='hidden sm:inline'>{nextId ?? '下一位'}</span>
        <ChevronRightIcon className='h-4 w-4' />
      </m.button>
    </div>
  );
}
