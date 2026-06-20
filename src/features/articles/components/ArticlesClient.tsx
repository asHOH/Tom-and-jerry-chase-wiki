'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { m, useReducedMotion } from 'motion/react';
import { Masonry } from 'react-plock';
import { useSnapshot } from 'valtio';

import { AssetManager } from '@/lib/assetManager';
import { formatCompactDate } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { useFilterState } from '@/lib/filterUtils';
import { shouldIgnorePageNavigationKey } from '@/lib/keyboardNavigation';
import { useMobile } from '@/hooks/useMediaQuery';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useUser } from '@/hooks/useUser';
import { useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
import { Article, ArticlesData, Category } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import { SkeletonArticleCard } from '@/components/ui/Skeleton';
import { ClockIcon, PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import { characters } from '@/data';

import ArticleFilters from './ArticleFilters';
import ArticlePagination from './ArticlePagination';

interface ArticlesClientProps {
  articles: ArticlesData;
  description?: string;
}

export default function ArticlesClient({ articles: data, description }: ArticlesClientProps) {
  const { role: userRole } = useUser();
  const isMobile = useMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isEditMode } = useEditMode();
  const { info } = useToast();
  const articlesGridRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const charactersSnap = useSnapshot(characters);

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
    if (isEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnorePageNavigationKey(e)) return;

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
    isEditMode,
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
        <div className='mt-8 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 px-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonArticleCard key={i} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className='space-y-2 md:space-y-8 dark:text-slate-200'>
      {/* Header */}
      <header className='mb-4 space-y-2 px-2 text-center md:mb-8 md:space-y-4 md:px-4'>
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
        />

        {/* Stats and Quick Actions */}
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center sm:justify-between',
            'mt-4 gap-2 px-2 md:mt-8 md:gap-4 md:px-4'
          )}
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
                {userRole !== 'Contributor' && (
                  <ButtonLink
                    href='/articles/pending'
                    variant='warning'
                    size='sm'
                    leadingIcon={<ClockIcon className='size-4' strokeWidth={1.5} />}
                  >
                    待审核
                  </ButtonLink>
                )}
                <ButtonLink
                  href='/articles/new'
                  size='sm'
                  leadingIcon={<PlusIcon className='size-4' strokeWidth={1.5} aria-hidden='true' />}
                >
                  新建文章
                </ButtonLink>
              </>
            ) : (
              <ButtonLink
                href='/usages/edit' /*'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=k06ydVKmTrT3BV8fYX8zOeve10bXcxR0&authKey=Dqg2BaUpTZVCaSDyRcFPeovGCDtwjpyAbNLPaoss0p3gmWO3sQe9pncD5uk1dZNO&noverify=0&group_code=615882730'*/
                variant='secondary'
                size='sm'
              >
                💡 登录后才可发表文章
              </ButtonLink>
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
              <Button onClick={handleClearFilters} variant='secondary'>
                清除筛选
              </Button>
            )}
            {userRole && <ButtonLink href='/articles/new'>创建文章</ButtonLink>}
          </div>
        </div>
      ) : (
        <m.div
          ref={isMobile ? (swipeContainerRef as React.RefObject<HTMLDivElement>) : articlesGridRef}
          className='md:mt-8 md:px-4'
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <Masonry
            items={visibleArticles}
            config={{
              columns: [1, 2, 3],
              gap: [16, 24, 24],
              media: [640, 1024, 1280],
              useBalancedLayout: true,
            }}
            render={(article) => {
              const latestVersion = article.latest_approved_version[0];
              const boundCharacter = article.character_id
                ? charactersSnap[article.character_id]
                : null;
              return (
                <BaseCard
                  variant='character'
                  aria-label={`查看文章 ${article.title}`}
                  className='character-card shover:shadow-lg transform transition-transform! hover:-translate-y-1'
                  href={`/articles/${article.id}`}
                  key={article.id}
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
                          className='h-8 w-8 rounded-lg object-cover ring-2 ring-blue-400 dark:ring-blue-500'
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
                      <div className='items-left flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400'>
                        <span>
                          发布:{' '}
                          {formatCompactDate(article.created_at, {
                            invalidFallback: '日期未知',
                          })}
                        </span>
                        {latestVersion && (
                          <span>
                            更新:{' '}
                            {formatCompactDate(latestVersion.created_at, {
                              invalidFallback: '日期未知',
                            })}
                          </span>
                        )}
                        <span>浏览: {article.view_count ?? 0}</span>
                      </div>

                      <object className='my-auto ml-auto'>
                        <div className='flex items-center gap-2'>
                          <div className='flex-1' />
                          <ButtonLink
                            href={`/articles/${article.id}/history`}
                            variant='secondary'
                            size='sm'
                            aria-label='查看历史版本'
                            title='查看历史版本'
                          >
                            <ClockIcon className='size-4' strokeWidth={1.5} />
                          </ButtonLink>
                        </div>
                      </object>
                    </div>
                  </div>
                </BaseCard>
              );
            }}
          />
        </m.div>
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
