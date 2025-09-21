import React from 'react';
import clsx from 'clsx';

export type EditorViewMode = 'rich' | 'wiki' | 'html';

export interface ViewModeToggleProps {
  mode: EditorViewMode;
  onChange: (mode: EditorViewMode) => void;
  disabled?: boolean;
  className?: string;
  labels?: { rich?: string; wiki?: string; html?: string };
  hideWiki?: boolean;
}

export const ViewModeToggle = React.memo(function ViewModeToggle({
  mode,
  onChange,
  disabled,
  className,
  labels,
  hideWiki,
}: ViewModeToggleProps) {
  const l = {
    rich: labels?.rich ?? 'Rich',
    html: labels?.html ?? 'HTML',
    wiki: labels?.wiki ?? 'WikiText',
  };
  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <button
        type='button'
        onClick={() => onChange('rich')}
        disabled={disabled}
        className={clsx(
          'p-2 rounded-md border text-sm',
          mode === 'rich'
            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
        )}
        title='富文本'
      >
        {l.rich}
      </button>
      <button
        type='button'
        onClick={() => onChange('html')}
        disabled={disabled}
        className={clsx(
          'p-2 rounded-md border text-sm',
          mode === 'html'
            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
        )}
        title='HTML'
      >
        {l.html}
      </button>
      {!hideWiki && (
        <button
          type='button'
          onClick={() => onChange('wiki')}
          disabled={disabled}
          className={clsx(
            'p-2 rounded-md border text-sm',
            mode === 'wiki'
              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
          )}
          title='WikiText'
        >
          {l.wiki} (实验)
        </button>
      )}
    </div>
  );
});

export default ViewModeToggle;
