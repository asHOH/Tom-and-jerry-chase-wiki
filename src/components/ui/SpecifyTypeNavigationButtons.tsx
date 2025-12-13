'use client';

import { motion } from 'motion/react';

import { useSpecifyTypeNavigation } from '@/hooks/useSpecifyTypeNavigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/CommonIcons';

type typelist = 'knowledgeCard' | 'specialSkill' | 'item' | 'entity' | 'buff';

interface TargetNavigationButtonsProps {
  currentId: string;
  specifyType: typelist;
  under?: boolean;
  className?: string;
}

/**
 * Navigation for knowledgeCards,specialSkills,items,entities
 * @param currentId - string - name of target to be searched
 * @param specifyType - 'knowledgeCard' | 'specialSkill' | 'item' | 'entity' | 'buff' -type of target to be searched
 * @param under - boolean(default false) - revease search to avoid same name(such as 应急治疗)
 */
export default function SpecifyTypeNavigationButtons({
  currentId,
  specifyType,
  under = false,
  className = '',
}: TargetNavigationButtonsProps) {
  const { previousTarget, nextTarget, navigateToPrevious, navigateToNext, currentIndex, totals } =
    useSpecifyTypeNavigation(currentId, specifyType, under);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Previous Target Button */}
      <motion.button
        onClick={navigateToPrevious}
        disabled={!previousTarget}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
          previousTarget
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}
        whileHover={previousTarget ? { scale: 1.05 } : {}}
        whileTap={previousTarget ? { scale: 0.95 } : {}}
      >
        <ChevronLeftIcon className='h-4 w-4' />
        <span className='inline'>{previousTarget ? previousTarget.target : '上一个'}</span>
      </motion.button>

      {/* Target Counter */}
      <div className='px-2 text-sm text-gray-600 dark:text-gray-400'>
        {currentIndex + 1} / {totals}
      </div>

      {/* Next Target Button */}
      <motion.button
        onClick={navigateToNext}
        disabled={!nextTarget}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
          nextTarget
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}
        whileHover={nextTarget ? { scale: 1.05 } : {}}
        whileTap={nextTarget ? { scale: 0.95 } : {}}
      >
        <span className='inline'>{nextTarget ? nextTarget.target : '下一个'}</span>
        <ChevronRightIcon className='h-4 w-4' />
      </motion.button>
    </div>
  );
}
