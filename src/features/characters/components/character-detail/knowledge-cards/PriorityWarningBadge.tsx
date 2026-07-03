import { cn } from '@/lib/design';
import Tooltip from '@/components/ui/Tooltip';

type PriorityWarningBadgeProps = {
  content: string;
  placement?: 'text' | 'image';
};

const PriorityWarningBadge = ({ content, placement = 'text' }: PriorityWarningBadgeProps) => (
  <Tooltip
    content={content}
    className={cn(
      'absolute -bottom-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border-none sm:-bottom-1 sm:h-6 sm:w-6',
      placement === 'image' ? 'right-0 sm:right-1' : '-right-2 sm:-right-1'
    )}
    clickToToggle
    triggerProps={{ role: 'button', 'aria-label': content, tabIndex: 0 }}
  >
    <span
      aria-hidden='true'
      className='flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs leading-none font-bold text-amber-800 shadow-sm ring-1 ring-amber-300/70 dark:bg-amber-800 dark:text-orange-50 dark:ring-orange-500/40'
    >
      !
    </span>
  </Tooltip>
);

export default PriorityWarningBadge;
