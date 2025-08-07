import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

export interface FactionButtonProps {
  emoji?: string;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  ariaLabel: string;
  className?: string;

  priority?: boolean;
}

export function FactionButton({
  emoji,
  imageSrc,
  imageAlt,
  title,
  description,
  href,
  onClick,
  ariaLabel,
  className,
  priority = false,
}: FactionButtonProps) {
  const buttonContent = (
    <>
      <div className='flex items-center flex-col gap-2 md:gap-3 md:flex-row'>
        {imageSrc ? (
          <div className='text-xl md:text-2xl'>
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              width={36}
              height={36}
              style={{ height: '36px', width: 'auto' }}
              className='object-contain flex-shrink-0 md:h-10 md:w-auto'
              priority={priority}
            />
          </div>
        ) : (
          <span className='text-xl md:text-2xl'>{emoji}</span>
        )}
        <span className='text-xl md:text-2xl font-bold whitespace-nowrap'>{title}</span>
      </div>
      <div className='text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1 dark:text-gray-400'>
        {description}
      </div>
    </>
  );

  if (href) {
    return (
      <button
        type='button'
        aria-label={ariaLabel}
        className={clsx(
          'faction-button',
          'flex gap-1 md:gap-2 text-center flex-1 min-w-[180px]',
          'bg-gray-200 text-gray-800 shadow-md rounded-md border-none focus:outline-none',
          'dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900 dark:border-gray-700',
          className
        )}
      >
        <Link
          href={href}
          className='flex flex-col items-center justify-center gap-1 md:gap-2 text-center flex-1 min-w-[180px] py-3'
        >
          {buttonContent}
        </Link>
      </button>
    );
  }

  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={ariaLabel}
      className={clsx(
        'faction-button',
        'py-3',
        'flex flex-col items-center justify-center gap-1 md:gap-2 text-center flex-1 min-w-[180px]',
        'bg-gray-200 text-gray-800 shadow-md rounded-md border-none focus:outline-none',
        'dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900 dark:border-gray-700',
        className
      )}
    >
      {buttonContent}
    </button>
  );
}

export default React.memo(FactionButton);
