'use client';

import React from 'react';

import { cn } from '@/lib/design';

interface ArticlePaginationProps {
  currentPage: number;
  clientTotalPages: number;
  handlePageChange: (newPage: number) => void;
  isMobile: boolean;
  selectedCategories: Set<string>;
}

const ArticlePagination: React.FC<ArticlePaginationProps> = ({
  currentPage,
  clientTotalPages,
  handlePageChange,
  isMobile,
  selectedCategories,
}) => {
  if (clientTotalPages <= 1) return null;

  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(clientTotalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const paginationButtonBase =
    'rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900';

  return (
    <div className='mt-8 flex flex-col items-center gap-4'>
      {/* Page indicator */}
      <div className='text-sm text-gray-600 dark:text-gray-400'>
        第 {currentPage} 页，共 {clientTotalPages} 页
        {!isMobile && (
          <span className='ml-2 text-xs text-gray-400 dark:text-gray-500'>
            (← → 键翻页{selectedCategories.size > 0 ? '，Esc 清除筛选' : ''})
          </span>
        )}
      </div>

      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label='上一页'
          className={cn(
            paginationButtonBase,
            'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          上一页
        </button>

        {startPage > 1 && (
          <>
            <button
              type='button'
              onClick={() => handlePageChange(1)}
              aria-label='第 1 页'
              className={cn(
                paginationButtonBase,
                'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              )}
            >
              1
            </button>
            {startPage > 2 && (
              <span className='px-2 text-gray-500' aria-hidden='true'>
                ...
              </span>
            )}
          </>
        )}

        {pages.map((page) => (
          <button
            type='button'
            key={page}
            onClick={() => handlePageChange(page)}
            aria-label={`第 ${page} 页`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              paginationButtonBase,
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            {page}
          </button>
        ))}

        {endPage < clientTotalPages && (
          <>
            {endPage < clientTotalPages - 1 && (
              <span className='px-2 text-gray-500' aria-hidden='true'>
                ...
              </span>
            )}
            <button
              type='button'
              onClick={() => handlePageChange(clientTotalPages)}
              aria-label={`第 ${clientTotalPages} 页`}
              className={cn(
                paginationButtonBase,
                'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              )}
            >
              {clientTotalPages}
            </button>
          </>
        )}

        <button
          type='button'
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= clientTotalPages}
          aria-label='下一页'
          className={cn(
            paginationButtonBase,
            'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          下一页
        </button>
      </div>

      {/* Mobile swipe hint */}
      {isMobile && clientTotalPages > 1 && (
        <p className='text-xs text-gray-400 dark:text-gray-500'>👆 左右滑动翻页</p>
      )}
    </div>
  );
};

export default ArticlePagination;
