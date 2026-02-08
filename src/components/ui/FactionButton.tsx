import React from 'react';
import clsx from 'clsx';

import Image from '@/components/Image';
import Link from '@/components/Link';

interface FactionButtonProps {
  emoji?: string;
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  description: string;
  href?: string;
  onClick?: () => void;
  ariaLabel: string;
  className?: string;

  preload?: boolean;
}

function FactionButton({
  emoji,
  imageSrc,
  imageAlt,
  title,
  description,
  href,
  onClick,
  ariaLabel,
  className,
  preload = false,
}: FactionButtonProps) {
  const buttonContent = (
    <>
      <div className='flex flex-col flex-row items-center gap-2 md:gap-3'>
        {imageSrc ? (
          <div className='text-xl md:text-2xl'>
            <Image
              src={imageSrc}
              alt={imageAlt || title || ''}
              width={36}
              height={36}
              className='h-9 w-auto flex-shrink-0 object-contain md:h-10'
              preload={preload}
            />
          </div>
        ) : (
          <span className='text-xl md:text-2xl'>{emoji}</span>
        )}
        {title != undefined && (
          <span className='text-xl font-bold whitespace-nowrap md:text-2xl'>{title}</span>
        )}
      </div>
      <div className='mt-0.5 text-xs text-gray-500 md:mt-1 md:text-sm dark:text-gray-400'>
        {description}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={clsx(
          'faction-button',
          'flex min-w-[180px] flex-1 flex-col items-center justify-center gap-1 py-3 text-center md:gap-2',
          'rounded-md border-none bg-gray-200 text-gray-800 shadow-md transition-colors',
          'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
          'dark:border-gray-700 dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900',
          className
        )}
      >
        {buttonContent}
      </Link>
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
        'flex min-w-[180px] flex-1 flex-col items-center justify-center gap-1 text-center md:gap-2',
        'rounded-md border-none bg-gray-200 text-gray-800 shadow-md transition-colors',
        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
        'dark:border-gray-700 dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900',
        className
      )}
    >
      {buttonContent}
    </button>
  );
}

export default React.memo(FactionButton);
