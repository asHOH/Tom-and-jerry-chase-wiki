'use client';

import React, { useEffect, useState } from 'react';

import { getNavigationButtonClasses } from '@/lib/design';
import { scheduleBackgroundPreparation } from '@/lib/scheduleBackgroundPreparation';
import { useMobile } from '@/hooks/useMediaQuery';
import { usePreparedComponent } from '@/hooks/usePreparedComponent';
import MotionButton from '@/components/ui/MotionButton';
import { SearchIcon } from '@/components/icons/CommonIcons';
import { searchDialogModule } from '@/components/panelModules';

import { BaseDialog } from './BaseDialog';
import Button from './Button';
import Tooltip from './Tooltip';

const SearchBar: React.FC<object> = () => {
  const isMobile = useMobile();
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [hasOpenedSearch, setHasOpenedSearch] = useState(false);
  const {
    Component: SearchDialog,
    error,
    retry,
  } = usePreparedComponent(searchDialogModule, showSearchDialog);

  useEffect(() => scheduleBackgroundPreparation([searchDialogModule.load]), []);

  const prepareSearch = () => {
    void searchDialogModule.load().catch((cause: unknown) => {
      console.warn('Unable to prepare search:', cause);
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key is '/' and if the event target is not an input or textarea
      if (
        event.key === '/' &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault(); // Prevent the '/' character from being typed
        setHasOpenedSearch(true);
        setShowSearchDialog(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenSearch = () => {
    setHasOpenedSearch(true);
    setShowSearchDialog(true);
  };

  const handleCloseSearch = () => {
    setShowSearchDialog(false);
  };

  return (
    <div>
      <Tooltip content='搜索 (快捷键：/ )' className='border-none' asChild>
        <MotionButton
          variant='unstyled'
          type='button'
          onClick={handleOpenSearch}
          onPointerEnter={prepareSearch}
          onFocus={prepareSearch}
          className={getNavigationButtonClasses(false, false, true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label='搜索'
        >
          {/* Search icon */}
          <SearchIcon className='h-6 w-6 text-gray-900 dark:text-gray-200' strokeWidth={1.5} />
        </MotionButton>
      </Tooltip>

      {SearchDialog && hasOpenedSearch ? (
        <SearchDialog open={showSearchDialog} onClose={handleCloseSearch} isMobile={isMobile} />
      ) : (
        <BaseDialog
          open={showSearchDialog}
          onOpenChange={setShowSearchDialog}
          ariaLabel='搜索'
          panelClassName='max-w-md p-6 md:w-full'
        >
          <p role='status'>{error ? '搜索加载失败，请重试' : '正在准备搜索…'}</p>
          {error && <Button onClick={retry}>重试</Button>}
          <Button variant='secondary' onClick={handleCloseSearch}>
            关闭
          </Button>
        </BaseDialog>
      )}
    </div>
  );
};

export default SearchBar;
