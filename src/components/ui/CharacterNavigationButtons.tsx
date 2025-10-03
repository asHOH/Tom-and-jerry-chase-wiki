'use client';

import React from 'react';
import { useCharacterNavigation } from '@/lib/hooks/useCharacterNavigation';
import { motion } from 'motion/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/CommonIcons';

interface CharacterNavigationButtonsProps {
  currentCharacterId: string;
  className?: string;
}

export default function CharacterNavigationButtons({
  currentCharacterId,
  className = '',
}: CharacterNavigationButtonsProps) {
  const {
    previousCharacter,
    nextCharacter,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    totalCharacters,
  } = useCharacterNavigation(currentCharacterId);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Previous Character Button */}
      <motion.button
        onClick={navigateToPrevious}
        disabled={!previousCharacter}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          previousCharacter
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
        }`}
        whileHover={previousCharacter ? { scale: 1.05 } : {}}
        whileTap={previousCharacter ? { scale: 0.95 } : {}}
      >
        <ChevronLeftIcon className='w-4 h-4' />
        <span className='hidden sm:inline'>
          {previousCharacter ? previousCharacter.character?.id : '上一个'}
        </span>
      </motion.button>

      {/* Character Counter */}
      <div className='text-sm text-gray-600 dark:text-gray-400 px-2'>
        {currentIndex + 1} / {totalCharacters}
      </div>

      {/* Next Character Button */}
      <motion.button
        onClick={navigateToNext}
        disabled={!nextCharacter}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          nextCharacter
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
        }`}
        whileHover={nextCharacter ? { scale: 1.05 } : {}}
        whileTap={nextCharacter ? { scale: 0.95 } : {}}
      >
        <span className='hidden sm:inline'>
          {nextCharacter ? nextCharacter.character?.id : '下一个'}
        </span>
        <ChevronRightIcon className='w-4 h-4' />
      </motion.button>
    </div>
  );
}
