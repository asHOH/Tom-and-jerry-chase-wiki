'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import clsx from 'clsx';
import useSWR from 'swr';

import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterLabel from '@/components/ui/FilterLabel';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import { useFilterState } from '@/lib/filterUtils';
import { sanitizeHTML } from '@/lib/xssUtils';

interface Article {
  id: string;
  title: string;
  created_at: string;
  author_id: string;
  category_id: string;
  categories: { id: string; name: string };
  users_public_view: { nickname: string };
  latest_approved_version: Array<{
    id: string;
    content: string;
    created_at: string;
    status: string;
    editor_id: string;
    users_public_view: { nickname: string };
  }>;
}

interface Category {
  id: string;
  name: string;
}

interface ArticlesData {
  articles: Article[];
  total_count: number;
  current_page: number;
  total_pages: number;
  categories: Category[];
  has_next: boolean;
  has_prev: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ArticlesClient() {
  const { role: userRole } = useUser();

  // Use centralized filter state management
  const {
    selectedFilters: selectedCategories,
    toggleFilter: toggleCategoryFilter,
    hasFilter: hasCategoryFilter,
    clearFilters: clearCategoryFilters,
  } = useFilterState<string>();

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: '20',
    sortBy,
    sortOrder,
  });

  if (selectedCategories.size > 0) {
    selectedCategories.forEach((category) => {
      params.append('category', category);
    });
  }

  const {
    data,
    error,
    isLoading: loading,
    mutate,
  } = useSWR<ArticlesData>(`/api/articles?${params.toString()}`, fetcher);

  const handleCategoryToggle = (categoryId: string) => {
    toggleCategoryFilter(categoryId);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (newSortBy: 'created_at' | 'title', newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const renderPagination = () => {
    if (!data || data.total_pages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(data.total_pages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className='flex items-center justify-center gap-2 mt-8'>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={!data.has_prev}
          className='px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          上一页
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className='px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
            >
              1
            </button>
            {startPage > 2 && <span className='px-2 text-gray-500'>...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < data.total_pages && (
          <>
            {endPage < data.total_pages - 1 && <span className='px-2 text-gray-500'>...</span>}
            <button
              onClick={() => setCurrentPage(data.total_pages)}
              className='px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
            >
              {data.total_pages}
            </button>
          </>
        )}

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={!data.has_next}
          className='px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          下一页
        </button>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <LoadingSpinner size='lg' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <BaseCard className='text-center py-12'>
          <div className='text-6xl mb-4'>🚫</div>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
            加载文章列表失败
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>请稍后重试或联系管理员</p>
          <button
            onClick={() => mutate()}
            className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            重试
          </button>
        </BaseCard>
      </div>
    );
  }
  return (
    <div className='space-y-8 dark:text-slate-200'>
      {/* Header */}
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>文章列表</PageTitle>
        <PageDescription>浏览和搜索猫和老鼠手游的文章内容</PageDescription>

        {/* Category Filter Controls */}
        {!!data && data.categories.length > 0 && (
          <div className='filter-section flex justify-center items-center gap-4 mt-8'>
            <FilterLabel displayMode='inline'>分类筛选:</FilterLabel>
            <FilterLabel displayMode='block'>筛选:</FilterLabel>
            <div className='flex flex-wrap gap-2 justify-center'>
              {data?.categories.map((category) => {
                const isActive = hasCategoryFilter(category.id);
                return (
                  <button
                    type='button'
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={clsx(
                      'filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none',
                      isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                    )}
                  >
                    {category.name}
                  </button>
                );
              })}
              {selectedCategories.size > 0 && (
                <button
                  type='button'
                  onClick={() => {
                    clearCategoryFilters();
                    setCurrentPage(1);
                  }}
                  className='filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                >
                  清除筛选
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className='filter-section flex justify-center items-center gap-4 mt-6'>
          <FilterLabel displayMode='inline'>排序方式:</FilterLabel>
          <FilterLabel displayMode='block'>排序:</FilterLabel>
          <div className='flex gap-2'>
            {[
              { value: 'created_at-desc', label: '最新发布' },
              { value: 'created_at-asc', label: '最早发布' },
              { value: 'title-asc', label: '标题 A-Z' },
              { value: 'title-desc', label: '标题 Z-A' },
            ].map((option) => {
              const isActive = `${sortBy}-${sortOrder}` === option.value;
              return (
                <button
                  type='button'
                  key={option.value}
                  onClick={() => {
                    const [newSortBy, newSortOrder] = option.value.split('-') as [
                      'created_at' | 'title',
                      'asc' | 'desc',
                    ];
                    handleSortChange(newSortBy, newSortOrder);
                  }}
                  className={clsx(
                    'filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none',
                    isActive
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats and Quick Actions */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 px-4'>
          <div className='text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left'>
            共找到 {data?.total_count || 0} 篇文章
            {selectedCategories.size > 0 && (
              <span className='block sm:inline'>
                {' '}
                (已筛选:{' '}
                {Array.from(selectedCategories)
                  .map((id) => data?.categories.find((c) => c.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')}
                )
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className='flex items-center justify-center gap-3'>
            {userRole && (
              <Link
                href='/articles/pending'
                className='inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 text-sm'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='size-4'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
                  />
                </svg>
                待审核
              </Link>
            )}

            {userRole && (
              <Link
                href='/articles/new'
                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='size-4'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
                </svg>
                新建文章
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Articles List */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <LoadingSpinner size='lg' />
        </div>
      ) : data?.articles.length === 0 ? (
        <div className='text-center py-12 px-4'>
          <div className='text-6xl mb-4'>📄</div>
          <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2'>
            {selectedCategories.size > 0 ? '未找到匹配的文章' : '暂无文章'}
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            {selectedCategories.size > 0
              ? '尝试调整搜索条件或筛选器'
              : '成为第一个创建文章的人吧！'}
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            {selectedCategories.size > 0 && (
              <button
                onClick={() => {
                  clearCategoryFilters();
                  setCurrentPage(1);
                }}
                className='px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200'
              >
                清除筛选
              </button>
            )}
            {userRole && (
              <Link
                href='/articles/new'
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200'
              >
                创建文章
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div
          className='auto-fit-grid grid-container grid gap-6 mt-8 px-4'
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
        >
          {data?.articles.map((article) => {
            const latestVersion = article.latest_approved_version[0];
            return (
              <BaseCard
                key={article.id}
                variant='character'
                role='button'
                aria-label={`查看文章 ${article.title}`}
                className='character-card shover:shadow-lg transform transition-transform hover:-translate-y-1'
              >
                <div className='px-4 pt-1 pb-5 flex flex-col h-full text-left'>
                  <h3 className='text-xl font-bold mb-2 dark:text-white line-clamp-2'>
                    <Link href={`/articles/${article.id}`}>{article.title}</Link>
                  </h3>

                  <div className='flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3'>
                    <span>作者: {article.users_public_view?.nickname || '未知'}</span>
                    <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs'>
                      {article.categories?.name || '未分类'}
                    </span>
                  </div>

                  <div
                    className='prose prose-sm max-w-none dark:prose-invert line-clamp-3 flex-1 mb-4'
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(
                        (latestVersion?.content?.substring(0, 150) || '') +
                          ((latestVersion?.content?.length || 0) > 150 ? '...' : '') || '暂无内容'
                      ),
                    }}
                  />

                  <div className='mt-auto'>
                    <div className='flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3'>
                      <span>
                        发布: {format(new Date(article.created_at), 'MM月dd日', { locale: zhCN })}
                      </span>
                      {latestVersion && (
                        <span>
                          更新:{' '}
                          {format(new Date(latestVersion.created_at), 'MM月dd日', { locale: zhCN })}
                        </span>
                      )}
                    </div>

                    <div className='flex items-center gap-2'>
                      <div className='flex-1' />
                      <Link
                        href={`/articles/${article.id}/history`}
                        className='px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-sm'
                        title='查看历史版本'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          strokeWidth={1.5}
                          stroke='currentColor'
                          className='size-4'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </BaseCard>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}
