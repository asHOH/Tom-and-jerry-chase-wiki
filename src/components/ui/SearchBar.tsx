'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence } from 'motion/react'; // Import AnimatePresence

import { useMobile } from '@/hooks/useMediaQuery';
import { SearchIcon } from '@/components/icons/CommonIcons';

import SearchDialog from './SearchDialog'; // Import the new SearchDialog component
import Tooltip from './Tooltip';

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
      <Tooltip content='搜索 (快捷键：/ )' className='border-none'>
        <button
          type='button'
          onClick={handleOpenSearch}
          className={clsx(
            'rounded-md bg-gray-200 text-gray-900',
            'dark:bg-slate-700 dark:text-gray-200',
            'focus:ring-2 focus:ring-blue-500 focus:outline-none dark:focus:ring-blue-400',
            'flex cursor-pointer items-center justify-center border-none transition-colors',
            isMobile ? 'h-[40px] w-[40px] p-2' : 'h-11 w-11 p-2'
          )}
        >
          {/* Search icon */}
          <SearchIcon className='h-6 w-6 text-gray-900 dark:text-gray-200' />
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
