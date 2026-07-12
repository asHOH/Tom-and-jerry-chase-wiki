'use client';

import { usePathname } from 'next/navigation';

import { cn, getActionButtonClasses } from '@/lib/design';
import { ChatBubbleIcon } from '@/components/icons/CommonIcons';

export type DiscussButtonProps = {
  className?: string;
  compact?: boolean;
};

export default function DiscussButton({ className, compact = false }: DiscussButtonProps) {
  const pathname = usePathname();
  // Ensure trailing slash, then append discussion
  const base = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const discussUrl = `${base}discussion/`;
  const title = '讨论此页面';

  if (compact) {
    return (
      <a
        href={discussUrl}
        aria-label={title}
        title={title}
        className={cn(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-none bg-teal-100 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-900/80 dark:text-teal-200 dark:hover:bg-teal-800/90',
          className
        )}
      >
        <ChatBubbleIcon className='h-3.5 w-3.5' aria-hidden='true' />
      </a>
    );
  }

  return (
    <a
      href={discussUrl}
      className={cn(
        getActionButtonClasses('primary', 'sm'),
        'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600',
        className
      )}
      title={title}
    >
      <ChatBubbleIcon className='h-4 w-4' aria-hidden='true' />
      讨论
    </a>
  );
}
