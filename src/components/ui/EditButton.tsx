'use client';

import { cn } from '@/lib/design';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';

export interface EditButtonProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show full label or just icon */
  compact?: boolean;
}

/**
 * Button to enter edit mode on the current page.
 * Adds ?edit=1 to the current URL.
 */
export default function EditButton({ className, compact = false }: EditButtonProps) {
  const { enterEditMode } = useSearchParamEditMode();

  return (
    <button
      type='button'
      onClick={enterEditMode}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
        'bg-amber-50 text-amber-700 hover:bg-amber-100',
        'dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30',
        'focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-slate-900',
        className
      )}
      title='编辑此页面'
    >
      <svg
        className='h-4 w-4'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={2}
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
        />
      </svg>
      {!compact && <span>编辑</span>}
    </button>
  );
}
