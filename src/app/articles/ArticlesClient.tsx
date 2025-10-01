'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterRow from '@/components/ui/FilterRow';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import { useFilterState } from '@/lib/filterUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import { useDarkMode } from '@/context/DarkModeContext';
import { PlusIcon } from '@/components/icons/CommonIcons';

const monthDayFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: '2-digit',
  day: '2-digit',
});

const formatMonthDay = (value: string | null | undefined) => {
  if (!value) {
    return '日期未知';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '日期未知';
  }
  const parts = monthDayFormatter.formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!month || !day) {
    return monthDayFormatter.format(date);
  }
  return `${month}月${day}日`;
};

interface Article {
  id: string;
  title: string;
  created_at: string;
  author_id: string;
  category_id: string;
  view_count?: number;
  categories: { id: string; name: string };
  users_public_view: { nickname: string };
  latest_approved_version: Array<{
    id: string | null;
    content: string | null;
    created_at: string | null;
    status: string | null;
    editor_id: string | null;
    users_public_view: { nickname: string } | null;
  }>;
}

interface Category {
  id: string;
  name: string;
}

interface ArticlesData {
  articles: Article[];
  // total_count: number;
  // current_page: number;
  // total_pages: number;
  categories: Category[];
  // has_next: boolean;
  // has_prev: boolean;
}

interface ArticlesClientProps {
  articles: ArticlesData;
  description?: string;
}

export default function ArticlesClient({ articles: data, description }: ArticlesClientProps) {
  const { role: userRole } = useUser();
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

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

  // const params = new URLSearchParams({
  //   // Fetch all articles once to enable client-side filtering/pagination
  //   limit: '9999',
  // });

  // Do not append category to params; filter on client

  // const {
  //   data,
  //   error,
  //   isLoading: loading,
  //   mutate,
  // } = useSWR<ArticlesData>(`/api/articles?${params.toString()}`, fetcher);

  const loading = false;
  const error = null;
  function mutate() {}

  const filteredArticles = useMemo(() => {
    if (!data?.articles) return [] as Article[];
    if (selectedCategories.size === 0) return data.articles;
    return data.articles.filter((a) => selectedCategories.has(a.category_id));
  }, [data?.articles, selectedCategories]);

  const sortedArticles = useMemo(() => {
    const arr = [...filteredArticles];
    if (sortBy === 'created_at') {
      arr.sort((a, b) =>
        sortOrder === 'desc'
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortBy === 'title') {
      arr.sort((a, b) => {
        const at = a.title || '';
        const bt = b.title || '';
        return sortOrder === 'asc' ? at.localeCompare(bt, 'zh-CN') : bt.localeCompare(at, 'zh-CN');
      });
    }
    return arr;
  }, [filteredArticles, sortBy, sortOrder]);

  const pageSize = 20;
  const clientTotalPages = Math.max(1, Math.ceil(sortedArticles.length / pageSize));
  const clampedPage = Math.min(currentPage, clientTotalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const visibleArticles = sortedArticles.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > clientTotalPages) {
      setCurrentPage(1);
    }
  }, [clientTotalPages, currentPage]);

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
    if (!data || clientTotalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(clientTotalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className='flex items-center justify-center gap-2 mt-8'>
        <button
          type='button'
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className='px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          上一页
        </button>

        {startPage > 1 && (
          <>
            <button
              type='button'
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
            type='button'
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

        {endPage < clientTotalPages && (
          <>
            {endPage < clientTotalPages - 1 && <span className='px-2 text-gray-500'>...</span>}
            <button
              type='button'
              onClick={() => setCurrentPage(clientTotalPages)}
              className='px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
            >
              {clientTotalPages}
            </button>
          </>
        )}

        <button
          type='button'
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= clientTotalPages}
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
            type='button'
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
    <div className={isMobile ? 'space-y-2 dark:text-slate-200' : 'space-y-8 dark:text-slate-200'}>
      {/* Header */}
      <header
        className={isMobile ? 'text-center space-y-2 mb-4 px-2' : 'text-center space-y-4 mb-8 px-4'}
      >
        <PageTitle>文章列表</PageTitle>
        {!isMobile && description && <PageDescription>{description}</PageDescription>}

        {/* Category Filter Controls */}
        {!!data && data.categories.length > 0 && (
          <>
            <FilterRow
              label='分类筛选:'
              options={data.categories.filter((c) => c.name !== '根分类').map((c) => c.id)}
              isActive={(id) => hasCategoryFilter(id)}
              onToggle={(id) => {
                handleCategoryToggle(id);
              }}
              className={isMobile ? 'gap-2 mt-4' : 'gap-4 mt-8'}
              innerClassName={!isMobile ? 'gap-2' : undefined}
              ariaLabel='categories'
              isDarkMode={isDarkMode}
              getOptionLabel={(id) => {
                return data.categories.find((c) => c.id === id)?.name ?? id;
              }}
              getButtonClassName={(id, active) => (
                void id,
                active
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
              )}
            />
            {selectedCategories.size > 0 && (
              <div className={isMobile ? 'flex justify-center mt-2' : 'flex justify-center mt-4'}>
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
              </div>
            )}
          </>
        )}

        {/* Sort Controls */}
        <FilterRow
          label='排序方式:'
          options={['created_at-desc', 'created_at-asc', 'title-asc', 'title-desc']}
          isActive={(opt) => `${sortBy}-${sortOrder}` === opt}
          onToggle={(opt) => {
            const [newSortBy, newSortOrder] = opt.split('-') as [
              'created_at' | 'title',
              'asc' | 'desc',
            ];
            handleSortChange(newSortBy, newSortOrder);
          }}
          className={isMobile ? 'gap-2 mt-2' : 'gap-4 mt-6'}
          innerClassName={!isMobile ? 'gap-2' : undefined}
          ariaLabel='sort'
          isDarkMode={isDarkMode}
          getOptionLabel={(opt) =>
            opt === 'created_at-desc'
              ? '最新发布'
              : opt === 'created_at-asc'
                ? '最早发布'
                : opt === 'title-asc'
                  ? '标题 A-Z'
                  : '标题 Z-A'
          }
          getButtonClassName={(opt, active) => (
            void opt,
            active
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
          )}
        />

        {/* Stats and Quick Actions */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${isMobile ? 'gap-2 mt-4 px-2' : 'gap-4 mt-8 px-4'}`}
        >
          <div className='text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left'>
            共找到 {filteredArticles.length} 篇文章
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
            {userRole ? (
              <>
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

                <Link
                  href='/articles/new'
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm'
                >
                  <PlusIcon className='size-4' strokeWidth={1.5} aria-hidden='true' />
                  新建文章
                </Link>
              </>
            ) : (
              <a
                href='http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=k06ydVKmTrT3BV8fYX8zOeve10bXcxR0&authKey=Dqg2BaUpTZVCaSDyRcFPeovGCDtwjpyAbNLPaoss0p3gmWO3sQe9pncD5uk1dZNO&noverify=0&group_code=615882730'
                className='text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700'
              >
                💡 若想发布文章，请进群咨询
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Articles List */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <LoadingSpinner size='lg' />
        </div>
      ) : filteredArticles.length === 0 ? (
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
                type='button'
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
          className={`auto-fit-grid grid-container grid ${!isMobile && 'gap-6 mt-8 px-4'}`}
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
        >
          {visibleArticles.map((article) => {
            const latestVersion = article.latest_approved_version[0];
            return (
              <BaseCard
                key={article.id}
                variant='character'
                role='button'
                aria-label={`查看文章 ${article.title}`}
                className='character-card shover:shadow-lg transform transition-transform! hover:-translate-y-1'
              >
                <div className='px-4 pt-2 pb-5 flex flex-col h-full text-left'>
                  <h3 className='text-xl font-bold mb-2 dark:text-white line-clamp-2'>
                    <Link href={`/articles/${article.id}`}>{article.title}</Link>
                  </h3>

                  <div className='flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3'>
                    <span>作者: {article.users_public_view?.nickname || '未知'}</span>
                    <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs'>
                      {article.categories?.name || '未分类'}
                    </span>
                  </div>

                  <RichTextDisplay content={latestVersion?.content} preview />

                  <div className='mt-auto flex'>
                    <div className='flex flex-col items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3'>
                      <span>发布: {formatMonthDay(article.created_at)}</span>
                      {latestVersion && (
                        <span>更新: {formatMonthDay(latestVersion.created_at)}</span>
                      )}
                      <span>浏览: {article.view_count ?? 0}</span>
                    </div>

                    <div className='flex items-center gap-2 ml-auto my-auto'>
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
