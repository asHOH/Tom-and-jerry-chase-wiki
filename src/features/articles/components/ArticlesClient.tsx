'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { m, useReducedMotion } from 'motion/react';
import { Masonry } from 'react-plock';

import { buildArticleListHref, type ArticleListParams } from '@/lib/articles/listParams';
import { AssetManager } from '@/lib/assetManager';
import { usePermissions } from '@/lib/auth/PermissionProvider';
import { formatCompactDate } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { shouldIgnorePageNavigationKey } from '@/lib/keyboardNavigation';
import { useMobile } from '@/hooks/useMediaQuery';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
import { ArticleListPageData, Category, type FactionId } from '@/data/types';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import EntityCardFrame from '@/components/ui/EntityCardFrame';
import PageHeader from '@/components/ui/PageHeader';
import { ClockIcon, PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

import { useArticleListScrollRestoration } from '../hooks/useArticleListScrollRestoration';
import ArticleFilters from './ArticleFilters';
import ArticlePagination from './ArticlePagination';

interface ArticlesClientProps {
  articles: ArticleListPageData;
  listParams: ArticleListParams;
  characterSummaries: Readonly<Record<string, { id: string; factionId?: FactionId }>>;
  description?: string;
}

export default function ArticlesClient({
  articles: data,
  listParams,
  characterSummaries,
  description,
}: ArticlesClientProps) {
  const permissions = usePermissions();
  const isMobile = useMobile();
  const router = useRouter();
  const { isEditMode } = useEditMode();
  const { info } = useToast();
  const articlesGridRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const selectedCategories = useMemo(
    () => new Set(listParams.categoryIds),
    [listParams.categoryIds]
  );

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

  const currentPage = data.current_page;
  const totalPages = Math.max(1, data.total_pages);
  const sortBy = listParams.sortBy;
  const sortOrder = listParams.sortOrder;

  useArticleListScrollRestoration(true);

  const updateURL = useCallback(
    (params: ArticleListParams) => {
      router.replace(buildArticleListHref(params), { scroll: false });
    },
    [router]
  );
  const hasCategoryFilter = useCallback(
    (categoryId: string) => selectedCategories.has(categoryId),
    [selectedCategories]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        updateURL({ ...listParams, page: newPage });
        // Scroll to top of articles grid for better UX
        articlesGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [listParams, totalPages, updateURL]
  );

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      const newCategories = new Set(selectedCategories);
      if (newCategories.has(categoryId)) {
        newCategories.delete(categoryId);
      } else {
        newCategories.add(categoryId);
      }
      updateURL({
        ...listParams,
        page: 1,
        categoryIds: Array.from(newCategories),
      });
    },
    [listParams, selectedCategories, updateURL]
  );
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      updateURL({ ...listParams, page: 1, categoryIds: [categoryId] });
    },
    [listParams, updateURL]
  );

  const handleClearFilters = useCallback(() => {
    updateURL({ ...listParams, page: 1, categoryIds: [] });
    info('已清除所有筛选条件');
  }, [info, listParams, updateURL]);

  const handleSortChange = useCallback(
    (newSortBy: 'created_at' | 'title' | 'view_count', newSortOrder: 'asc' | 'desc') => {
      updateURL({ ...listParams, page: 1, sortBy: newSortBy, sortOrder: newSortOrder });
    },
    [listParams, updateURL]
  );

  // Swipe gesture for mobile pagination - returns ref to attach to swipeable element
  const swipeContainerRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    },
    onSwipeRight: () => {
      if (currentPage > 1) {
        handlePageChange(currentPage - 1);
      }
    },
    disabled: !isMobile || totalPages <= 1,
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
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
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
    totalPages,
    handlePageChange,
    isEditMode,
    selectedCategories.size,
    handleClearFilters,
  ]);

  return (
    <div className='space-y-2 md:space-y-8 dark:text-slate-200'>
      {/* Header */}
      <PageHeader title='文章列表' description={description} className='mb-4 md:mb-8'>
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
            共 {data.total_count} 篇文章
            {selectedCategories.size > 0 && (
              <span className='block sm:inline'>
                {' '}
                (已筛选:{' '}
                {Array.from(selectedCategories)
                  .map((id) => data.categories.find((c) => c.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')}
                )
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className='flex items-center justify-center gap-3'>
            {permissions.has('article.create') ||
            permissions.has('article.update_own') ||
            permissions.has('article.update_any') ? (
              <>
                {permissions.has('article_version.approve') && (
                  <ButtonLink
                    href='/articles/pending'
                    variant='warning'
                    size='sm'
                    className='text-white dark:text-white'
                    leadingIcon={<ClockIcon className='size-4' strokeWidth={1.5} />}
                  >
                    待审核
                  </ButtonLink>
                )}
                {permissions.has('article.create') && (
                  <ButtonLink
                    href='/articles/new'
                    size='sm'
                    leadingIcon={
                      <PlusIcon className='size-4' strokeWidth={1.5} aria-hidden='true' />
                    }
                  >
                    新建文章
                  </ButtonLink>
                )}
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
      </PageHeader>

      {/* Screen reader announcement for filter results */}
      <div aria-live='polite' aria-atomic='true' className='sr-only'>
        {data.total_count} 篇文章
        {selectedCategories.size > 0 && `，已筛选 ${selectedCategories.size} 个分类`}
      </div>

      {/* Articles List */}
      {data.articles.length === 0 ? (
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
            {permissions.has('article.create') && (
              <ButtonLink href='/articles/new'>创建文章</ButtonLink>
            )}
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
            items={data.articles}
            config={{
              columns: [1, 2, 3],
              gap: [16, 24, 24],
              media: [640, 1024, 1280],
              useBalancedLayout: true,
            }}
            render={(article) => {
              const latestVersion = article.current_version;
              const boundCharacter = article.character_id
                ? characterSummaries[article.character_id]
                : null;
              return (
                <EntityCardFrame
                  variant='portrait'
                  aria-label={`查看文章 ${article.title}`}
                  className='character-card transform transition-transform! hover:-translate-y-1'
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
                          handleCategorySelect(article.category_id);
                        }}
                        role='button'
                      >
                        {article.categories?.name || '未分类'}
                      </span>
                    </div>

                    <p className='mt-1 mb-3 line-clamp-3 text-sm'>
                      {latestVersion?.excerpt || '暂无摘要'}
                    </p>

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
                </EntityCardFrame>
              );
            }}
          />
        </m.div>
      )}

      {/* Pagination */}
      <ArticlePagination
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
        isMobile={isMobile}
        selectedCategories={selectedCategories}
      />
    </div>
  );
}
