'use client';

import { ReactNode, useState } from 'react';

import { cn } from '@/lib/design';
import { useNavigation } from '@/hooks/useNavigation';
import { ChevronDownIcon, LinkIcon } from '@/components/icons/CommonIcons';

export default function CharacterSection({
  title,
  children,
  to,
}: {
  title: string;
  children: ReactNode;
  to?: string;
}) {
  const sectionId = `Section:${title}`;
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
      className={cn(
        'flex scroll-mt-24 flex-col transition-all',
        isOpen ? 'duration-300 ease-out' : 'duration-200 ease-in',
        isOpen ? 'mb-8' : 'mb-0'
      )}
      id={sectionId}
    >
      <div className='mb-1 flex items-center px-2 py-3 text-2xl font-bold dark:text-white'>
        <div className='flex min-w-0 items-center gap-1'>
          <button type='button' className='cursor-pointer focus:outline-none' onClick={toggleOpen}>
            <h3>{title}</h3>
          </button>
          <a
            href={`#${sectionId}`}
            aria-label={`链接到${title}`}
            title={`链接到“${title}”`}
            className='rounded p-1 text-gray-400 opacity-0 transition-opacity hover:text-blue-600 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:hover:text-blue-400'
          >
            <LinkIcon className='size-4' />
          </a>
        </div>
        <button
          type='button'
          aria-label={to ? `前往${title}` : isOpen ? `折叠${title}` : `展开${title}`}
          className='ml-auto cursor-pointer rounded p-1 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none'
          onClick={toggleOpen}
        >
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
            <ChevronDownIcon
              className={cn(
                'h-6 w-6 transform transition-transform duration-200 ease-out motion-reduce:transition-none',
                isOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          )}
        </button>
      </div>
      {isMounted && (
        <div
          className={cn(
            'transition-all ease-out',
            isOpen ? 'duration-300' : 'duration-200',
            isOpen ? 'max-h-2500 opacity-100' : 'max-h-0 opacity-0'
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
