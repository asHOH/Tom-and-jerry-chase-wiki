'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/design';
import type { ActionDependencyDescriptor } from '@/lib/gameData/actionDependencies';
import type { PendingActionOverlapSummary } from '@/lib/gameData/pendingActionAwarenessTypes';
import { usePendingFieldAwareness } from '@/context/PendingActionAwarenessContext';
import { ExclamationTriangleIcon } from '@/components/icons/CommonIcons';

export function getPendingActionWarningText(summary: PendingActionOverlapSummary): string {
  const parts: string[] = [];
  if (summary.otherCount > 0) {
    parts.push(`其他编辑者有 ${summary.otherCount} 条待审核改动`);
  }
  if (summary.ownCount > 0) {
    parts.push(`您有 ${summary.ownCount} 条待审核改动`);
  }
  if (summary.publicCount > 0) parts.push('其中部分改动已公开但仍在等待复核');
  if (summary.truncated) parts.push('待审核改动较多，当前提示可能不完整');
  parts.push('继续修改可能产生覆盖或审核冲突');
  return `${parts.join('；')}。`;
}

export function getPendingActionWarningClassName(
  summary: PendingActionOverlapSummary | null
): string | undefined {
  if (!summary) return undefined;
  return summary.otherCount > 0
    ? 'outline-2 outline-offset-2 outline-amber-500/80 dark:outline-amber-400/80'
    : 'outline-2 outline-offset-2 outline-blue-500/70 dark:outline-blue-400/70';
}

export function PendingActionWarningIndicator({
  summary,
}: {
  summary: PendingActionOverlapSummary | null;
}) {
  const tooltipId = useId();
  if (!summary) return null;
  const text = getPendingActionWarningText(summary);
  const isOther = summary.otherCount > 0;

  return (
    <span
      className={cn(
        'group/pending relative ml-1 inline-flex shrink-0 cursor-help align-middle',
        isOther ? 'text-amber-600 dark:text-amber-300' : 'text-blue-600 dark:text-blue-300'
      )}
      tabIndex={0}
      role='note'
      aria-label={text}
      aria-describedby={tooltipId}
    >
      <ExclamationTriangleIcon className='h-4 w-4' aria-hidden='true' />
      <span
        id={tooltipId}
        role='tooltip'
        className='bg-surface-raised text-foreground border-border invisible absolute bottom-full left-1/2 z-120 mb-2 w-64 -translate-x-1/2 rounded-md border px-2.5 py-2 text-xs leading-5 shadow-xl group-hover/pending:visible group-focus/pending:visible'
      >
        {text}
      </span>
    </span>
  );
}

export function PendingActionWarningBoundary({
  descriptors,
  children,
  className,
}: {
  descriptors: readonly ActionDependencyDescriptor[];
  children: ReactNode;
  className?: string;
}) {
  const summary = usePendingFieldAwareness(descriptors);
  return (
    <div className={cn('relative', getPendingActionWarningClassName(summary), className)}>
      {children}
      <PendingActionWarningIndicator summary={summary} />
    </div>
  );
}
