'use client';

import { motion } from 'motion/react';

import { useSpecifyTypeNavigation } from '@/hooks/useSpecifyTypeNavigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/CommonIcons';

type typelist =
  | 'knowledgeCard'
  | 'specialSkill'
  | 'item'
  | 'entity'
  | 'buff'
  | 'map'
  | 'fixture'
  | 'mode';

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

  const baseButtonClasses = 'flex items-center gap-1 rounded-lg px-3 py-2 transition-colors border';
  const enabledButtonClasses =
    'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700';
  const disabledButtonClasses =
    'cursor-not-allowed bg-gray-200 text-gray-500 border-gray-300 dark:bg-gray-700 dark:text-gray-500 dark:border-gray-700';

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {/* Previous Target Button */}
      <motion.button
        onClick={navigateToPrevious}
        disabled={!previousTarget}
        className={`${baseButtonClasses} ${
          previousTarget ? enabledButtonClasses : `${disabledButtonClasses}`
        }`}
        whileHover={previousTarget ? { scale: 1.05 } : {}}
        whileTap={previousTarget ? { scale: 0.95 } : {}}
      >
        <ChevronLeftIcon className='h-4 w-4' />
        <span className='inline'>{previousTarget?.target ?? ''}</span>
      </motion.button>

      {/* Target Counter */}
      <div className='flex items-baseline gap-1 text-sm text-gray-600 dark:text-gray-400'>
        <span className='font-medium'>{currentIndex + 1}</span>
        <span className='text-xs text-gray-400 dark:text-gray-500'>/{totals}</span>
      </div>

      {/* Next Target Button */}
      <motion.button
        onClick={navigateToNext}
        disabled={!nextTarget}
        className={`${baseButtonClasses} ${
          nextTarget ? enabledButtonClasses : `${disabledButtonClasses}`
        }`}
        whileHover={nextTarget ? { scale: 1.05 } : {}}
        whileTap={nextTarget ? { scale: 0.95 } : {}}
      >
        <span className='inline'>{nextTarget?.target ?? ''}</span>
        <ChevronRightIcon className='h-4 w-4' />
      </motion.button>
    </div>
  );
}
