import React from 'react';

import { cn, getSelectionControlClasses } from '@/lib/design';
import Button from '@/components/ui/Button';

export type EditorViewMode = 'rich' | 'wiki' | 'html';

interface ViewModeToggleProps {
  mode: EditorViewMode;
  onChange: (mode: EditorViewMode) => void;
  disabled?: boolean;
  className?: string;
  labels?: { rich?: string; wiki?: string; html?: string };
  hideWiki?: boolean;
}

const ViewModeToggle = React.memo(function ViewModeToggle({
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
    'focus-visible:ring-focus inline-flex h-8 items-center justify-center p-2 rounded-md text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';
  const buttonConfigs: Array<{ mode: EditorViewMode; label: string; title: string }> = [
    { mode: 'rich', label: l.rich, title: '富文本' },
    { mode: 'html', label: l.html, title: 'HTML' },
  ];

  if (!hideWiki) {
    buttonConfigs.push({ mode: 'wiki', label: `${l.wiki} (实验)`, title: 'WikiText' });
  }

  return (
    <div role='group' aria-label='编辑模式' className={cn('flex items-center gap-1', className)}>
      {buttonConfigs.map(({ mode: targetMode, label, title }) => (
        <Button
          variant='unstyled'
          key={targetMode}
          type='button'
          aria-pressed={mode === targetMode}
          onClick={() => onChange(targetMode)}
          disabled={disabled}
          className={cn(baseButtonClasses, getSelectionControlClasses(mode === targetMode))}
          title={title}
        >
          {label}
        </Button>
      ))}
    </div>
  );
});

export default ViewModeToggle;
