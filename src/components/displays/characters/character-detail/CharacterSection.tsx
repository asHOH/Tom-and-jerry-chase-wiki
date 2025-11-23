'use client';

import { useNavigation } from '@/hooks/useNavigation';
import clsx from 'clsx';
import { ReactNode, useState } from 'react';

export default function CharacterSection({
  title,
  children,
  to,
}: {
  title: string;
  children: ReactNode;
  to?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(true); // Unmount content when folded to avoid lingering overlays
  const { navigate } = useNavigation();

  const toggleOpen = () => {
    if (to) {
      navigate(to);
      return;
    }

    if (isOpen) {
      // Start closing animation; unmount on transition end
      setIsOpen(false);
    } else {
      // Mount first, then open on next frame to allow transition-in
      setIsMounted(true);
      requestAnimationFrame(() => setIsOpen(true));
    }
  };

  return (
    <div
      className={clsx(
        'transition-all flex flex-col',
        isOpen ? 'duration-300 ease-out' : 'duration-200 ease-in',
        isOpen ? 'mb-8' : 'mb-0'
      )}
      id={`Section:${title}`}
    >
      <button
        type='button'
        aria-label={isOpen ? `折叠${title}` : `展开${title}`}
        className='flex items-center justify-between w-full text-2xl font-bold px-2 py-3 mb-1 focus:outline-none cursor-pointer dark:text-white'
        onClick={toggleOpen}
      >
        <h3>{title}</h3>
        {to ? (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='size-6'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='m7.49 12-3.75 3.75m0 0 3.75 3.75m-3.75-3.75h16.5V4.499'
            />
          </svg>
        ) : (
          <svg
            className={clsx(
              'w-6 h-6 transform transition-transform duration-200 ease-out',
              isOpen ? 'rotate-0' : '-rotate-90'
            )}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M19 9l-7 7-7-7'
            ></path>
          </svg>
        )}
      </button>
      {isMounted && (
        <div
          className={clsx(
            'transition-all ease-out',
            isOpen ? 'duration-300' : 'duration-200',
            isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
          )}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          aria-hidden={!isOpen}
          onTransitionEnd={() => {
            if (!isOpen) setIsMounted(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
