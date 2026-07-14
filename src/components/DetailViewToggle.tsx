'use client';

import { cn } from '@/lib/design';
import { useFeatureDiscovery } from '@/hooks/useFeatureDiscovery';
import { useAppContext } from '@/context/AppContext';

import AttentionDot from './ui/AttentionDot';
import Tooltip from './ui/Tooltip';

export default function DetailViewToggle() {
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const { shouldPrompt: showToggleHint, dismiss: dismissToggleHint } =
    useFeatureDiscovery('detail_toggle');
  const toggleLabel = isDetailedView ? '切换至简明描述' : '切换至详细描述';

  return (
    <Tooltip content={toggleLabel} className='border-none'>
      <button
        type='button'
        aria-pressed={isDetailedView}
        aria-label={toggleLabel}
        className={cn(
          'relative flex min-h-10 cursor-pointer rounded-lg border-none bg-gray-100 p-1 transition-all duration-200',
          'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-500',
          'md:min-h-11 dark:border-gray-600 dark:bg-slate-800 dark:focus-visible:outline-blue-300'
        )}
        onClick={() => {
          toggleDetailedView();
          if (showToggleHint) dismissToggleHint();
        }}
      >
        <AttentionDot
          visible={showToggleHint}
          color={isDetailedView ? 'orange' : 'blue'}
          className='-top-1 -right-1'
        />

        <div
          className={cn(
            'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md shadow-sm transition-all duration-200 ease-out',
            isDetailedView
              ? 'left-1 translate-x-full transform bg-orange-100 dark:bg-orange-900'
              : 'left-1 translate-x-0 transform bg-blue-100 dark:bg-blue-900'
          )}
        />

        <div
          className={cn(
            'relative z-10 flex items-center justify-center px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200 md:py-1.5 md:text-sm lg:py-2',
            !isDetailedView
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-500'
          )}
        >
          <span className='lg:hidden'>简</span>
          <span className='hidden lg:inline'>简明</span>
        </div>

        <div
          className={cn(
            'relative z-10 flex items-center justify-center px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200 md:py-1.5 md:text-sm lg:py-2',
            isDetailedView
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-500 dark:text-gray-500'
          )}
        >
          <span className='lg:hidden'>详</span>
          <span className='hidden lg:inline'>详细</span>
        </div>
      </button>
    </Tooltip>
  );
}
