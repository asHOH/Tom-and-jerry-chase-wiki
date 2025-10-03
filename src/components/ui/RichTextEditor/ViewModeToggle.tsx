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
  const baseButtonClasses =
    'inline-flex h-8 items-center justify-center p-2 rounded-md border text-sm';
  const activeClasses =
    'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300';
  const inactiveClasses =
    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300';
  const buttonConfigs: Array<{ mode: EditorViewMode; label: string; title: string }> = [
    { mode: 'rich', label: l.rich, title: '富文本' },
    { mode: 'html', label: l.html, title: 'HTML' },
  ];

  if (!hideWiki) {
    buttonConfigs.push({ mode: 'wiki', label: `${l.wiki} (实验)`, title: 'WikiText' });
  }

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {buttonConfigs.map(({ mode: targetMode, label, title }) => (
        <button
          key={targetMode}
          type='button'
          onClick={() => onChange(targetMode)}
          disabled={disabled}
          className={clsx(baseButtonClasses, mode === targetMode ? activeClasses : inactiveClasses)}
          title={title}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

export default ViewModeToggle;
