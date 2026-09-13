'use client';

import { cn } from '@/lib/design';
import {
  useSpecifyTypeNavigation,
  type NavigationEntityType,
} from '@/hooks/useSpecifyTypeNavigation';
import type { FactionId } from '@/data/types';
import MotionButton from '@/components/ui/MotionButton';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/CommonIcons';

interface TargetNavigationButtonsProps {
  currentId: string;
  specifyType: NavigationEntityType;
  factionId?: FactionId | undefined;
  className?: string;
}

/**
 * Navigation for knowledgeCards,specialSkills,items,entities
 * @param currentId - string - name of target to be searched
 * @param specifyType - 'knowledgeCard' | 'specialSkill' | 'item' | 'entity' | 'buff' -type of target to be searched
 * @param factionId - Identifies the current special skill or achievement within its faction.
 */
export default function SpecifyTypeNavigationButtons({
  currentId,
  specifyType,
  factionId,
  className = '',
}: TargetNavigationButtonsProps) {
  const { previousTarget, nextTarget, navigateToPrevious, navigateToNext, currentIndex, totals } =
    useSpecifyTypeNavigation(currentId, specifyType, factionId);

  const baseButtonClasses = 'flex items-center gap-1 rounded-lg px-3 py-2 transition-colors border';
  const enabledButtonClasses =
    'bg-control text-gray-900 border-gray-300 hover:bg-control-hover dark:text-gray-100 dark:border-gray-700';
  const disabledButtonClasses =
    'bg-control-hover cursor-not-allowed border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-500';

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {/* Previous Target Button */}
      <MotionButton
        variant='unstyled'
        onClick={navigateToPrevious}
        disabled={!previousTarget}
        className={cn(
          baseButtonClasses,
          previousTarget ? enabledButtonClasses : disabledButtonClasses
        )}
        whileHover={previousTarget ? { scale: 1.05 } : {}}
        whileTap={previousTarget ? { scale: 0.95 } : {}}
      >
        <ChevronLeftIcon className='h-4 w-4' />
        <span className='inline'>{previousTarget?.target ?? ''}</span>
      </MotionButton>

      {/* Target Counter */}
      <div className='flex items-baseline gap-1 text-sm text-gray-600 dark:text-gray-400'>
        <span className='font-medium'>{currentIndex + 1}</span>
        <span className='text-xs text-gray-400 dark:text-gray-500'>/{totals}</span>
      </div>

      {/* Next Target Button */}
      <MotionButton
        variant='unstyled'
        onClick={navigateToNext}
        disabled={!nextTarget}
        className={cn(baseButtonClasses, nextTarget ? enabledButtonClasses : disabledButtonClasses)}
        whileHover={nextTarget ? { scale: 1.05 } : {}}
        whileTap={nextTarget ? { scale: 0.95 } : {}}
      >
        <span className='inline'>{nextTarget?.target ?? ''}</span>
        <ChevronRightIcon className='h-4 w-4' />
      </MotionButton>
    </div>
  );
}
