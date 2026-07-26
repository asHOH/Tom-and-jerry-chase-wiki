'use client';

import { cn } from '@/lib/design';

import DiscussButton from './DiscussButton';
import EditButton from './EditButton';

export type DiscussEditButtonsProps = {
  className?: string;
  compact?: boolean;
  isEditMode: boolean;
};

export default function DiscussEditButtons({
  className,
  compact = false,
  isEditMode,
}: DiscussEditButtonsProps) {
  return (
    <span className={cn('inline-flex rounded-md', className)}>
      {isEditMode ? (
        <DiscussButton compact={compact} />
      ) : (
        <>
          <DiscussButton compact={compact} className='rounded-r-none' />
          <EditButton compact={compact} className='-ml-px rounded-l-none' />
        </>
      )}
    </span>
  );
}
