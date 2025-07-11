import React from 'react';
import Image from 'next/image';
import clsx from 'clsx';

export interface FactionButtonProps {
  emoji?: string;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  description: string;
  onClick: () => void;
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
  onClick,
  ariaLabel,
  className,

  priority = false,
}: FactionButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={ariaLabel}
      className={clsx(
        'faction-button',
        'sm:px-6',
        'sm:py-4',
        'px-4',
        'py-3',
        'flex flex-col items-center justify-center gap-2 text-center flex-1 min-w-[180px]',
        'bg-gray-200 text-gray-800 shadow-md rounded-md border-none focus:outline-none',
        'dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900 dark:border-gray-700',
        className
      )}
    >
      <div className='flex items-center gap-3'>
        {imageSrc ? (
          <div className='text-2xl'>
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              width={64}
              height={64}
              style={{ height: '40px', width: 'auto' }}
              className='object-contain flex-shrink-0'
              priority={priority}
            />
          </div>
        ) : (
          <span className='text-2xl'>{emoji}</span>
        )}
        <span className='text-2xl font-bold whitespace-nowrap'>{title}</span>
      </div>
      <div className='text-sm text-gray-500 mt-1 dark:text-gray-400'>{description}</div>
    </button>
  );
}

export default React.memo(FactionButton);
