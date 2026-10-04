'use client';

import React from 'react';

import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';

interface ArticlePaginationProps {
  currentPage: number;
  totalPages: number;
  handlePageChange: (newPage: number) => void;
  isMobile: boolean;
  selectedCategories: Set<string>;
}

const ArticlePagination: React.FC<ArticlePaginationProps> = ({
  currentPage,
  totalPages,
  handlePageChange,
  isMobile,
  selectedCategories,
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const paginationButtonBase =
    'rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900';

  return (
    <div className='mt-8 flex flex-col items-center gap-4'>
      {/* Page indicator */}
      <div className='text-sm text-gray-600 dark:text-gray-400'>
        第 {currentPage} 页，共 {totalPages} 页
        {!isMobile && (
          <span className='ml-2 text-xs text-gray-400 dark:text-gray-500'>
            (← → 键翻页{selectedCategories.size > 0 ? '，Esc 清除筛选' : ''})
          </span>
        )}
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label='上一页'
          className={cn(
            paginationButtonBase,
            'bg-control hover:bg-control-hover text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300'
          )}
        >
          上一页
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => handlePageChange(1)}
              aria-label='第 1 页'
              className={cn(
                paginationButtonBase,
                'bg-control hover:bg-control-hover text-gray-700 dark:text-gray-300'
              )}
            >
              1
            </Button>
            {startPage > 2 && (
              <span className='px-2 text-gray-500' aria-hidden='true'>
                ...
              </span>
            )}
          </>
        )}

        {pages.map((page) => (
          <Button
            variant='unstyled'
            type='button'
            key={page}
            onClick={() => handlePageChange(page)}
            aria-label={`第 ${page} 页`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              paginationButtonBase,
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-control hover:bg-control-hover text-gray-700 dark:text-gray-300'
            )}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className='px-2 text-gray-500' aria-hidden='true'>
                ...
              </span>
            )}
            <Button
              variant='unstyled'
              type='button'
              onClick={() => handlePageChange(totalPages)}
              aria-label={`第 ${totalPages} 页`}
              className={cn(
                paginationButtonBase,
                'bg-control hover:bg-control-hover text-gray-700 dark:text-gray-300'
              )}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant='unstyled'
          type='button'
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label='下一页'
          className={cn(
            paginationButtonBase,
            'bg-control hover:bg-control-hover text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300'
          )}
        >
          下一页
        </Button>
      </div>

      {/* Mobile swipe hint */}
      {isMobile && totalPages > 1 && (
        <p className='text-xs text-gray-400 dark:text-gray-500'>👆 左右滑动翻页</p>
      )}
    </div>
  );
};

export default ArticlePagination;
