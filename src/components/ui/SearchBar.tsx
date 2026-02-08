'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';

import { getNavigationButtonClasses } from '@/lib/design-system';
import { useMobile } from '@/hooks/useMediaQuery';
import { SearchIcon } from '@/components/icons/CommonIcons';

import SearchDialog from './SearchDialog';
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
      <Tooltip content='搜索 (快捷键：/ )' className='border-none' asChild>
        <m.button
          type='button'
          onClick={handleOpenSearch}
          className={getNavigationButtonClasses(false, false, true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label='搜索'
        >
          {/* Search icon */}
          <SearchIcon className='h-6 w-6 text-gray-900 dark:text-gray-200' strokeWidth={1.5} />
        </m.button>
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
