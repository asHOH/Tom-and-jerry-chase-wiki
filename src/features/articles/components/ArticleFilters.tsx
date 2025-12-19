'use client';

import React from 'react';

import { Category } from '@/data/types';
import FilterRow from '@/components/ui/FilterRow';

type SortBy = 'created_at' | 'title' | 'view_count';
type SortOrder = 'asc' | 'desc';

interface ArticleFiltersProps {
  categoriesForFilter: Category[];
  categoryOptions: string[];
  selectedCategories: Set<string>;
  hasCategoryFilter: (id: string) => boolean;
  handleCategoryToggle: (id: string) => void;
  handleClearFilters: () => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  handleSortChange: (newSortBy: SortBy, newSortOrder: SortOrder) => void;
  isDarkMode: boolean;
  isMobile: boolean;
}

const ArticleFilters: React.FC<ArticleFiltersProps> = ({
  categoriesForFilter,
  categoryOptions,
  selectedCategories,
  hasCategoryFilter,
  handleCategoryToggle,
  handleClearFilters,
  sortBy,
  sortOrder,
  handleSortChange,
  isDarkMode,
  isMobile,
}) => {
  return (
    <>
      {/* Category Filter Controls */}
      {categoriesForFilter.length > 0 && (
        <>
          <FilterRow
            label='分类筛选:'
            options={categoryOptions}
            isActive={(id) => hasCategoryFilter(String(id))}
            onToggle={(id) => {
              handleCategoryToggle(String(id));
            }}
            ariaLabel='categories'
            isDarkMode={isDarkMode}
            getOptionLabel={(id) => {
              const categoryId = String(id);
              return (
                categoriesForFilter.find((category) => category.id === categoryId)?.name ??
                categoryId
              );
            }}
            getButtonClassName={(id, active) => (
              void id,
              active
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
            )}
          />
          {selectedCategories.size > 0 && (
            <div className={isMobile ? 'mt-2 flex justify-center' : 'mt-4 flex justify-center'}>
              <button
                type='button'
                onClick={handleClearFilters}
                className='filter-button cursor-pointer rounded-md border-none bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-all duration-200 hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:focus:ring-offset-gray-900'
              >
                清除筛选
              </button>
            </div>
          )}
        </>
      )}

      {/* Sort Controls */}
      <FilterRow
        label='排序方式:'
        options={[
          'created_at-desc',
          'created_at-asc',
          'title-asc',
          'title-desc',
          'view_count-desc',
          'view_count-asc',
        ]}
        isActive={(opt) => `${sortBy}-${sortOrder}` === opt}
        onToggle={(opt) => {
          const [newSortBy, newSortOrder] = opt.split('-') as [
            'created_at' | 'title' | 'view_count',
            'asc' | 'desc',
          ];
          handleSortChange(newSortBy, newSortOrder);
        }}
        ariaLabel='sort'
        isDarkMode={isDarkMode}
        getOptionLabel={(opt) =>
          opt === 'created_at-desc'
            ? '最近发布'
            : opt === 'created_at-asc'
              ? '最早发布'
              : opt === 'title-asc'
                ? '标题 A-Z'
                : opt === 'title-desc'
                  ? '标题 Z-A'
                  : opt === 'view_count-asc'
                    ? '浏览量最少'
                    : '浏览量最多'
        }
        getButtonClassName={(opt, active) => (
          void opt,
          active
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
        )}
      />
    </>
  );
};

export default ArticleFilters;
