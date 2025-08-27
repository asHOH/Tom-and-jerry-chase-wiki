'use client';

import React from 'react';
import { useEntityNavigation } from '@/lib/hooks/useEntityNavigation';
import { motion } from 'motion/react';

// (For entities, Id refers to 'entityName')
interface EntityNavigationButtonsProps {
  currentEntityId: string;
  className?: string;
}

export default function EntityNavigationButtons({
  currentEntityId,
  className = '',
}: EntityNavigationButtonsProps) {
  const {
    previousEntity,
    nextEntity,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    totalEntities,
  } = useEntityNavigation(currentEntityId);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Previous Entity Button */}
      <motion.button
        onClick={navigateToPrevious}
        disabled={!previousEntity}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          previousEntity
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
        }`}
        whileHover={previousEntity ? { scale: 1.05 } : {}}
        whileTap={previousEntity ? { scale: 0.95 } : {}}
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
          {previousEntity ? previousEntity.entity : '上一个'}
        </span>
      </motion.button>

      {/* Entity Counter */}
      <div className='text-sm text-gray-600 dark:text-gray-400 px-2'>
        {currentIndex + 1} / {totalEntities}
      </div>

      {/* Next Entity Button */}
      <motion.button
        onClick={navigateToNext}
        disabled={!nextEntity}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          nextEntity
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
        }`}
        whileHover={nextEntity ? { scale: 1.05 } : {}}
        whileTap={nextEntity ? { scale: 0.95 } : {}}
      >
        <span className='hidden sm:inline'>{nextEntity ? nextEntity.entity : '下一个'}</span>
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
