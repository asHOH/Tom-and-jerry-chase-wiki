'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import SearchDialog from './SearchDialog'; // Import the new SearchDialog component
import Tooltip from './Tooltip';
import { useMobile } from '@/hooks/useMediaQuery';
import clsx from 'clsx';

const SearchBar: React.FC<object> = () => {
  const isMobile = useMobile();
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key is '/' and if the event target is not an input or textarea
      if (
        event.key === '/' &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault(); // Prevent the '/' character from being typed
        setShowSearchDialog(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenSearch = () => {
    setShowSearchDialog(true);
  };

  const handleCloseSearch = () => {
    setShowSearchDialog(false);
  };

  return (
    <div>
      <Tooltip content='搜索 (快捷键：/ )' className='border-none' delay={800}>
        <button
          type='button'
          onClick={handleOpenSearch}
          className={clsx(
            'rounded-md bg-gray-200 text-gray-900',
            'dark:bg-slate-700 dark:text-gray-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
            'flex items-center justify-center border-none cursor-pointer transition-colors',
            isMobile ? 'p-2 w-[40px] h-[40px]' : 'p-2 w-11 h-11'
          )}
        >
          {/* Search icon */}
          <svg
            className='h-6 w-6 text-gray-900 dark:text-gray-200'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </button>
      </Tooltip>

      <AnimatePresence mode='wait'>
        {' '}
        {/* Wrap with AnimatePresence */}
        {showSearchDialog && (
          <SearchDialog
            onClose={handleCloseSearch}
            isMobile={isMobile} // Pass isMobile prop
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
