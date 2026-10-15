'use client';

import React from 'react';

import { Category } from '@/data/types';
import ClearFiltersButton from '@/components/ui/ClearFiltersButton';
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
            activeTone='blue'
            onToggle={(id) => {
              handleCategoryToggle(String(id));
            }}
            ariaLabel='categories'
            getOptionLabel={(id) => {
              const categoryId = String(id);
              return (
                categoriesForFilter.find((category) => category.id === categoryId)?.name ??
                categoryId
              );
            }}
          />
          {selectedCategories.size > 0 && (
            <div className='mt-2 flex justify-center md:mt-4'>
              <ClearFiltersButton onClick={handleClearFilters} />
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
        activeTone='green'
        onToggle={(opt) => {
          const [newSortBy, newSortOrder] = opt.split('-') as [
            'created_at' | 'title' | 'view_count',
            'asc' | 'desc',
          ];
          handleSortChange(newSortBy, newSortOrder);
        }}
        ariaLabel='sort'
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
      />
    </>
  );
};

export default ArticleFilters;
