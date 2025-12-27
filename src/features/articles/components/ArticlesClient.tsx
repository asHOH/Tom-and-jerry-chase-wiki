'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AssetManager } from '@/lib/assetManager';
import { useFilterState } from '@/lib/filterUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useUser } from '@/hooks/useUser';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastContext';
import { Article, ArticlesData, Category } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import { SkeletonArticleCard } from '@/components/ui/Skeleton';
import { ClockIcon, PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { characters } from '@/data';

import ArticleFilters from './ArticleFilters';
import ArticlePagination from './ArticlePagination';

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

interface ArticlesClientProps {
  articles: ArticlesData;
  description?: string;
}

export default function ArticlesClient({ articles: data, description }: ArticlesClientProps) {
  const { role: userRole } = useUser();
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { info } = useToast();
  const articlesGridRef = useRef<HTMLDivElement>(null);

  // Use centralized filter state management
  const {
    selectedFilters: selectedCategories,
    toggleFilter: toggleCategoryFilter,
    hasFilter: hasCategoryFilter,
    clearFilters: clearCategoryFilters,
    setFilters: setCategoryFilters,
  } = useFilterState<string>();

  const categoriesForFilter = useMemo<Category[]>(() => {
    if (!data?.categories) return [];

    return data.categories
      .filter((category) => category.name !== '根分类')
      .sort((a, b) => {
        if (a.name === '其他类型' && b.name !== '其他类型') return 1;
        if (b.name === '其他类型' && a.name !== '其他类型') return -1;
        return 0;
      });
  }, [data.categories]);

  const categoryOptions = useMemo<string[]>(
    () => categoriesForFilter.map((category) => category.id),
    [categoriesForFilter]
  );

  // Initialize state from URL params
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? Math.max(1, parseInt(page, 10) || 1) : 1;
  });
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'view_count'>(() => {
    const sort = searchParams.get('sort');
    if (sort === 'title' || sort === 'view_count') return sort;
    return 'created_at';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const order = searchParams.get('order');
    return order === 'asc' ? 'asc' : 'desc';
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize category filters from URL on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      const categoryIds = categoryParam.split(',').filter(Boolean);
      if (categoryIds.length > 0) {
        setCategoryFilters(new Set(categoryIds));
      }
    }
    setIsInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state to URL
  const updateURL = useCallback(
    (params: { page?: number; sort?: string; order?: string; category?: string }) => {
      const newParams = new URLSearchParams(searchParams.toString());

      if (params.page !== undefined) {
        if (params.page === 1) newParams.delete('page');
        else newParams.set('page', String(params.page));
      }
      if (params.sort !== undefined) {
        if (params.sort === 'created_at') newParams.delete('sort');
        else newParams.set('sort', params.sort);
      }
      if (params.order !== undefined) {
        if (params.order === 'desc') newParams.delete('order');
        else newParams.set('order', params.order);
      }
      if (params.category !== undefined) {
        if (!params.category) newParams.delete('category');
        else newParams.set('category', params.category);
      }

      const queryString = newParams.toString();
      router.replace(queryString ? `?${queryString}` : '/articles', { scroll: false });
    },
    [router, searchParams]
  );

  const filteredArticles = (() => {
    if (!data?.articles) return [] as Article[];
    if (selectedCategories.size === 0) return data.articles;
    return data.articles.filter((a) => selectedCategories.has(a.category_id));
  })();

  const sortedArticles = (() => {
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
    } else if (sortBy === 'view_count') {
      arr.sort((a, b) => {
        const at = a.view_count || 0;
        const bt = b.view_count || 0;
        return sortOrder === 'asc' ? at - bt : bt - at;
      });
    }
    return arr;
  })();

  const pageSize = 18;
  const clientTotalPages = Math.max(1, Math.ceil(sortedArticles.length / pageSize));
  const clampedPage = Math.min(currentPage, clientTotalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const visibleArticles = sortedArticles.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > clientTotalPages) {
      setCurrentPage(1);
      updateURL({ page: 1 });
    }
  }, [clientTotalPages, currentPage, updateURL]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= clientTotalPages) {
        setCurrentPage(newPage);
        updateURL({ page: newPage });
        // Scroll to top of articles grid for better UX
        articlesGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [clientTotalPages, updateURL]
  );

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      toggleCategoryFilter(categoryId);
      setCurrentPage(1);
      // Update URL with new category state
      const newCategories = new Set(selectedCategories);
      if (newCategories.has(categoryId)) {
        newCategories.delete(categoryId);
      } else {
        newCategories.add(categoryId);
      }
      updateURL({
        page: 1,
        category: Array.from(newCategories).join(','),
      });
    },
    [toggleCategoryFilter, selectedCategories, updateURL]
  );

  const handleClearFilters = useCallback(() => {
    clearCategoryFilters();
    setCurrentPage(1);
    updateURL({ page: 1, category: '' });
    info('已清除所有筛选条件');
  }, [clearCategoryFilters, updateURL, info]);

  const handleSortChange = useCallback(
    (newSortBy: 'created_at' | 'title' | 'view_count', newSortOrder: 'asc' | 'desc') => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      setCurrentPage(1);
      updateURL({ page: 1, sort: newSortBy, order: newSortOrder });
    },
    [updateURL]
  );

  // Swipe gesture for mobile pagination - returns ref to attach to swipeable element
  const swipeContainerRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentPage < clientTotalPages) {
        handlePageChange(currentPage + 1);
      }
    },
    onSwipeRight: () => {
      if (currentPage > 1) {
        handlePageChange(currentPage - 1);
      }
    },
    disabled: !isMobile || clientTotalPages <= 1,
    threshold: 80,
  });

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < clientTotalPages) {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (e.key === 'Escape' && selectedCategories.size > 0) {
        e.preventDefault();
        handleClearFilters();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPage,
    clientTotalPages,
    handlePageChange,
    selectedCategories.size,
    handleClearFilters,
  ]);

  // Show skeleton while initializing from URL params
  if (!isInitialized) {
    return (
      <div className='space-y-8 dark:text-slate-200'>
        <header className='mb-8 space-y-4 px-4 text-center'>
          <PageTitle>文章列表</PageTitle>
          {description && <PageDescription>{description}</PageDescription>}
        </header>
        <div
          className='mt-8 grid gap-6 px-4'
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonArticleCard key={i} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={isMobile ? 'space-y-2 dark:text-slate-200' : 'space-y-8 dark:text-slate-200'}>
      {/* Header */}
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>文章列表</PageTitle>
        {description && <PageDescription>{description}</PageDescription>}

        <ArticleFilters
          categoriesForFilter={categoriesForFilter}
          categoryOptions={categoryOptions}
          selectedCategories={selectedCategories}
          hasCategoryFilter={hasCategoryFilter}
          handleCategoryToggle={handleCategoryToggle}
          handleClearFilters={handleClearFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSortChange={handleSortChange}
          isDarkMode={isDarkMode}
          isMobile={isMobile}
        />

        {/* Stats and Quick Actions */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${isMobile ? 'mt-4 gap-2 px-2' : 'mt-8 gap-4 px-4'}`}
        >
          <div className='text-center text-sm text-gray-600 sm:text-left dark:text-gray-400'>
            共 {filteredArticles.length} 篇文章
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
                  className='inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-yellow-700'
                >
                  <ClockIcon className='size-4' strokeWidth={1.5} />
                  待审核
                </Link>

                <Link
                  href='/articles/new'
                  className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-blue-700'
                >
                  <PlusIcon className='size-4' strokeWidth={1.5} aria-hidden='true' />
                  新建文章
                </Link>
              </>
            ) : (
              <a
                href='http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=k06ydVKmTrT3BV8fYX8zOeve10bXcxR0&authKey=Dqg2BaUpTZVCaSDyRcFPeovGCDtwjpyAbNLPaoss0p3gmWO3sQe9pncD5uk1dZNO&noverify=0&group_code=615882730'
                className='rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
              >
                💡 若想发布文章，请进群咨询
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Screen reader announcement for filter results */}
      <div aria-live='polite' aria-atomic='true' className='sr-only'>
        {filteredArticles.length} 篇文章
        {selectedCategories.size > 0 && `，已筛选 ${selectedCategories.size} 个分类`}
      </div>

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <div className='px-4 py-12 text-center'>
          <div className='mb-4 text-6xl'>📄</div>
          <h3 className='mb-2 text-xl font-semibold text-gray-800 dark:text-gray-200'>
            {selectedCategories.size > 0 ? '没有匹配的文章' : '暂无文章'}
          </h3>
          <p className='mb-6 text-gray-600 dark:text-gray-400'>
            {selectedCategories.size > 0
              ? '尝试调整搜索条件或筛选器'
              : '成为第一个创建文章的人吧！'}
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            {selectedCategories.size > 0 && (
              <button
                type='button'
                onClick={handleClearFilters}
                className='rounded-lg bg-gray-100 px-6 py-2 text-gray-700 transition-all duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900'
              >
                清除筛选
              </button>
            )}
            {userRole && (
              <Link
                href='/articles/new'
                className='rounded-lg bg-blue-600 px-6 py-2 text-white transition-all duration-200 hover:bg-blue-700'
              >
                创建文章
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div
          ref={isMobile ? (swipeContainerRef as React.RefObject<HTMLDivElement>) : articlesGridRef}
          className={`auto-fit-grid grid-container grid ${!isMobile && 'mt-8 gap-6 px-4'}`}
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
        >
          {visibleArticles.map((article) => {
            const latestVersion = article.latest_approved_version[0];
            const boundCharacter = article.character_id ? characters[article.character_id] : null;
            return (
              <BaseCard
                key={article.id}
                variant='character'
                aria-label={`查看文章 ${article.title}`}
                className='character-card shover:shadow-lg transform transition-transform! hover:-translate-y-1'
                href={`/articles/${article.id}`}
              >
                <div className='flex h-full flex-col px-4 py-3 text-left'>
                  {/* Character badge for game strategy articles */}
                  {boundCharacter && (
                    <div className='mb-2 flex items-center gap-2'>
                      <Image
                        src={AssetManager.getCharacterImageUrl(
                          boundCharacter.id,
                          boundCharacter.factionId ?? 'cat'
                        )}
                        alt={boundCharacter.id}
                        width={32}
                        height={32}
                        className='h-8 w-8 rounded-full object-cover ring-2 ring-blue-400 dark:ring-blue-500'
                      />
                      <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                        {boundCharacter.id}攻略
                      </span>
                    </div>
                  )}

                  <h3 className='mb-2 line-clamp-2 text-xl font-bold dark:text-white'>
                    {article.title}
                  </h3>

                  <div className='mb-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400'>
                    <span>作者: {article.users_public_view?.nickname || '未知'}</span>
                    <span
                      className='rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-800/50'
                      onClick={(ev) => {
                        ev.preventDefault();
                        setCategoryFilters(new Set([article.category_id]));
                      }}
                      role='button'
                    >
                      {article.categories?.name || '未分类'}
                    </span>
                  </div>

                  <RichTextDisplay content={latestVersion?.content} preview />

                  <div className='mt-auto mb-2 flex'>
                    <div className='flex flex-col items-center justify-between text-xs text-gray-600 dark:text-gray-400'>
                      <span>发布: {formatMonthDay(article.created_at)}</span>
                      {latestVersion && (
                        <span>更新: {formatMonthDay(latestVersion.created_at)}</span>
                      )}
                      <span>浏览: {article.view_count ?? 0}</span>
                    </div>

                    <object className='my-auto ml-auto'>
                      <div className='flex items-center gap-2'>
                        <div className='flex-1' />
                        <Link
                          href={`/articles/${article.id}/history`}
                          className='rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          title='查看历史版本'
                        >
                          <ClockIcon className='size-4' strokeWidth={1.5} />
                        </Link>
                      </div>
                    </object>
                  </div>
                </div>
              </BaseCard>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <ArticlePagination
        currentPage={currentPage}
        clientTotalPages={clientTotalPages}
        handlePageChange={handlePageChange}
        isMobile={isMobile}
        selectedCategories={selectedCategories}
      />
    </div>
  );
}
