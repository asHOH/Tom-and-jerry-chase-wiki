'use client';

import type { MouseEvent, ReactNode } from 'react';
import clsx from 'clsx';

import Link from '@/components/Link';

export type ActionTileProps = {
  title: ReactNode;
  icon?: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  tone?: 'default' | 'active';
  interaction?: 'normal' | 'current-page' | 'disabled';
  className?: string;
  titleClassName?: string;
};

const sizeClasses = {
  sm: 'h-9 gap-1 px-1',
  md: 'h-12 gap-2 px-2',
} as const;

export default function ActionTile({
  title,
  icon,
  href,
  external = false,
  onClick,
  ariaLabel,
  size = 'md',
  tone = 'default',
  interaction = 'normal',
  className,
  titleClassName,
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
    'group flex items-center overflow-hidden rounded-lg shadow-md transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:focus-visible:ring-blue-400',
    sizeClasses[size],
    tone === 'active'
      ? 'bg-blue-600 text-white dark:bg-blue-700'
      : 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-gray-200',
    allowHoverAccent &&
      'hover:-translate-y-1 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600',
    isCurrentPage && 'pointer-events-none cursor-not-allowed',
    isDisabled && 'cursor-not-allowed opacity-60',
    className
  );

  const titleClasses = clsx(
    'truncate',
    size === 'sm' ? 'text-xs' : 'text-sm',
    allowHoverAccent && 'group-hover:text-white',
    titleClassName
  );

  const content = (
    <>
      {icon ? <span className='shrink-0 text-current'>{icon}</span> : null}
      <span className={titleClasses}>{title}</span>
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
