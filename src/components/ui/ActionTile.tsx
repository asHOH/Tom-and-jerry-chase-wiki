'use client';

import type { MouseEvent, ReactNode } from 'react';
import clsx from 'clsx';

import Link from '@/components/Link';

export type ActionTileProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  ariaLabel: string;
  layout?: 'inline' | 'stacked';
  size?: 'sm' | 'md';
  tone?: 'default' | 'active';
  interaction?: 'normal' | 'current-page' | 'disabled';
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

const sizeClasses = {
  inline: {
    sm: 'h-9 gap-1 px-1',
    md: 'h-12 gap-2 px-2',
  },
  stacked: {
    sm: 'min-w-[180px] gap-1 px-4 py-3',
    md: 'min-w-[180px] gap-2 px-6 py-4',
  },
} as const;

export default function ActionTile({
  title,
  description,
  icon,
  href,
  external = false,
  onClick,
  ariaLabel,
  layout = 'inline',
  size = 'md',
  tone = 'default',
  interaction = 'normal',
  className,
  titleClassName,
  descriptionClassName,
}: ActionTileProps) {
  const isCurrentPage = interaction === 'current-page';
  const isDisabled = interaction === 'disabled';
  const isBlocked = isCurrentPage || isDisabled;
  const allowHoverAccent = tone === 'default' && interaction === 'normal';

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (isBlocked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.();
  };

  const tileClasses = clsx(
    'group overflow-hidden shadow-md transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:focus-visible:ring-blue-400',
    layout === 'inline'
      ? 'flex items-center rounded-lg'
      : 'flex flex-col items-center justify-center rounded-md text-center',
    sizeClasses[layout][size],
    tone === 'active'
      ? layout === 'inline'
        ? 'bg-blue-600 text-white dark:bg-blue-700'
        : 'bg-blue-100 text-blue-900 ring-2 ring-blue-500 dark:bg-blue-900/40 dark:text-blue-100 dark:ring-blue-400'
      : clsx(
          'bg-gray-200 text-gray-800',
          layout === 'inline' ? 'dark:bg-slate-700' : 'dark:bg-black',
          'dark:text-gray-200'
        ),
    allowHoverAccent &&
      'hover:-translate-y-1 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600',
    isCurrentPage && 'pointer-events-none cursor-not-allowed',
    isDisabled && 'cursor-not-allowed opacity-60',
    className
  );

  const titleClasses = clsx(
    layout === 'inline'
      ? clsx('truncate', size === 'sm' ? 'text-xs' : 'text-sm')
      : clsx('font-bold whitespace-nowrap', size === 'sm' ? 'text-xl' : 'text-2xl'),
    allowHoverAccent && 'group-hover:text-white',
    titleClassName
  );

  const descriptionClasses = clsx(
    'mt-1 text-sm',
    tone === 'active' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400',
    allowHoverAccent && 'group-hover:text-white',
    descriptionClassName
  );

  const content = (
    <>
      {layout === 'inline' ? (
        <>
          {icon ? <span className='shrink-0 text-current'>{icon}</span> : null}
          <span className={titleClasses}>{title}</span>
        </>
      ) : (
        <>
          <div className='flex items-center gap-3'>
            {icon ? <span className='shrink-0 text-current'>{icon}</span> : null}
            <span className={titleClasses}>{title}</span>
          </div>
          {description ? <div className={descriptionClasses}>{description}</div> : null}
        </>
      )}
    </>
  );

  if (href) {
    const sharedProps = {
      className: tileClasses,
      onClick: handleClick,
      'aria-label': ariaLabel,
      ...(isBlocked ? { 'aria-disabled': true, tabIndex: -1 } : {}),
      ...(isCurrentPage ? { 'aria-current': 'page' as const } : {}),
    };

    if (external) {
      return (
        <a href={href} rel='noopener noreferrer' target='_blank' {...sharedProps}>
          {content}
        </a>
      );
    }

    return (
      <Link href={href} {...sharedProps}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type='button'
      className={tileClasses}
      disabled={isDisabled}
      onClick={handleClick}
      aria-label={ariaLabel}
      {...(isBlocked ? { 'aria-disabled': true, tabIndex: -1 } : {})}
      {...(isCurrentPage ? { 'aria-current': 'page' as const } : {})}
    >
      {content}
    </button>
  );
}
