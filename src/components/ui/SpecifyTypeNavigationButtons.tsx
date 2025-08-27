'use client';

import React from 'react';
import { useSpecifyTypeNavigation } from '@/lib/hooks/useSpecifyTypeNavigation';
import { motion } from 'motion/react';

//The NavigationButtons for knowledgeCards,specialSkills,items,entities
type typelist = 'item' | 'entity';

interface TargetNavigationButtonsProps {
  currentId: string;
  specifyType: typelist;
  className?: string;
}

export default function SpecifyTypeNavigationButtons({
  currentId,
  specifyType,
  className = '',
}: TargetNavigationButtonsProps) {
  const { previousTarget, nextTarget, navigateToPrevious, navigateToNext, currentIndex, totals } =
    useSpecifyTypeNavigation(currentId, specifyType);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Previous Target Button */}
      <motion.button
        onClick={navigateToPrevious}
        disabled={!previousTarget}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          previousTarget
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
        }`}
        whileHover={previousTarget ? { scale: 1.05 } : {}}
        whileTap={previousTarget ? { scale: 0.95 } : {}}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='w-4 h-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
        </svg>
        <span className='hidden sm:inline'>
          {previousTarget ? previousTarget.target : '上一个'}
        </span>
      </motion.button>

      {/* Target Counter */}
      <div className='text-sm text-gray-600 dark:text-gray-400 px-2'>
        {currentIndex + 1} / {totals}
      </div>

      {/* Next Target Button */}
      <motion.button
        onClick={navigateToNext}
        disabled={!nextTarget}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          nextTarget
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
        }`}
        whileHover={nextTarget ? { scale: 1.05 } : {}}
        whileTap={nextTarget ? { scale: 0.95 } : {}}
      >
        <span className='hidden sm:inline'>{nextTarget ? nextTarget.target : '下一个'}</span>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='w-4 h-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
        </svg>
      </motion.button>
    </div>
  );
}
