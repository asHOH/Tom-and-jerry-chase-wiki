'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import PageTitle from '@/components/ui/PageTitle';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';

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

export default function ArticlesPage() {
  const { role: userRole } = useUser();
  const [data, setData] = useState<ArticlesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/articles?${params}`);

      if (!response.ok) {
        setError('加载文章列表失败');
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('加载文章列表时发生错误');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, sortBy, sortOrder]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
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
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2'>{error}</h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>请稍后重试或联系管理员</p>
          <button
            onClick={fetchArticles}
            className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            重试
          </button>
        </BaseCard>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      {/* Header */}
      <div className='mb-8'>
        <PageTitle>文章列表</PageTitle>
        <p className='mt-2 text-gray-600 dark:text-gray-400'>浏览和搜索汤姆杰瑞追逐战的文章内容</p>
      </div>

      {/* Search and Filters */}
      <div className='mb-6'>
        <BaseCard className='p-6'>
          <div className='flex flex-col gap-6'>
            {/* Filters and Controls */}
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
              {/* Category Filter */}
              <div className='flex items-center gap-4'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  分类筛选:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className='px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='all'>全部分类</option>
                  {data?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Controls */}
              <div className='flex items-center gap-4'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  排序方式:
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [
                      'created_at' | 'title',
                      'asc' | 'desc',
                    ];
                    handleSortChange(newSortBy, newSortOrder);
                  }}
                  className='px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='created_at-desc'>最新发布</option>
                  <option value='created_at-asc'>最早发布</option>
                  <option value='title-asc'>标题 A-Z</option>
                  <option value='title-desc'>标题 Z-A</option>
                </select>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      {/* Stats */}
      <div className='mb-6'>
        <BaseCard className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              共找到 {data?.total_count || 0} 篇文章
              {selectedCategory !== 'all' && (
                <span>
                  {' '}
                  (分类: {data?.categories.find((c) => c.id === selectedCategory)?.name || '未知'})
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className='flex items-center gap-3'>
              {userRole && (
                <Link
                  href='/articles/pending'
                  className='inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm'
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
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
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
        </BaseCard>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <LoadingSpinner size='lg' />
        </div>
      ) : data?.articles.length === 0 ? (
        <BaseCard className='text-center py-12'>
          <div className='text-6xl mb-4'>📄</div>
          <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2'>
            {selectedCategory !== 'all' ? '未找到匹配的文章' : '暂无文章'}
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            {selectedCategory !== 'all' ? '尝试调整搜索条件或筛选器' : '成为第一个创建文章的人吧！'}
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                }}
                className='px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
              >
                清除筛选
              </button>
            )}
            {userRole && (
              <Link
                href='/articles/new'
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                创建文章
              </Link>
            )}
          </div>
        </BaseCard>
      ) : (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {data?.articles.map((article) => {
            const latestVersion = article.latest_approved_version[0];
            return (
              <BaseCard key={article.id} className='p-6 hover:shadow-lg transition-shadow'>
                <div className='flex flex-col h-full'>
                  {/* Article Header */}
                  <div className='mb-4'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2'>
                      <Link
                        href={`/articles/${article.id}`}
                        className='hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                      >
                        {article.title}
                      </Link>
                    </h3>

                    <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
                      <span>作者: {article.users_public_view?.nickname || '未知'}</span>
                      <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs'>
                        {article.categories?.name || '未分类'}
                      </span>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className='flex-1 mb-4'>
                    <div
                      className='prose prose-sm max-w-none dark:prose-invert line-clamp-3'
                      dangerouslySetInnerHTML={{
                        __html:
                          (latestVersion?.content?.substring(0, 150) || '') +
                            ((latestVersion?.content?.length || 0) > 150 ? '...' : '') ||
                          '暂无内容',
                      }}
                    />
                  </div>

                  {/* Article Footer */}
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
                      <Link
                        href={`/articles/${article.id}`}
                        className='flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                      >
                        阅读文章
                      </Link>

                      <Link
                        href={`/articles/${article.id}/history`}
                        className='px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm'
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
