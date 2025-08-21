'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import clsx from 'clsx';
import useSWR from 'swr';

import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';

interface PendingVersion {
  preview_token: string;
  article_id: string;
  title: string;
  content: string;
  status: 'pending' | 'rejected';
  created_at: string;
  editor_nickname: string;
  author_nickname: string;
  category_name: string;
}

interface PendingData {
  pending_versions: PendingVersion[];
  total_count: number;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      const error = new Error('An error occurred while fetching the data.') as Error & {
        info: unknown;
        status: number;
      };
      error.info = res.json();
      error.status = res.status;
      throw error;
    }
    return res.json();
  });

export default function PendingClient() {
  const { role: userRole } = useUser();
  const [filter, setFilter] = useState<'all' | 'pending' | 'rejected'>('all');

  const { data, error, mutate } = useSWR<PendingData>('/api/articles/pending', fetcher);

  const loading = !data && !error;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        text: '待审核',
      },
      rejected: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        text: '已拒绝',
      },
    } as const;

    const config = statusConfig[status as 'pending' | 'rejected'] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const filteredVersions =
    data?.pending_versions.filter((version) => {
      if (filter === 'all') return true;
      return version.status === filter;
    }) || [];

  const canModerate = userRole === 'Reviewer' || userRole === 'Coordinator';

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
          <div className='text-6xl mb-4'>⚠️</div>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
            {error.status === 401 ? '请先登录查看待审核内容' : '加载待审核内容失败'}
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>请检查您的登录状态或联系管理员</p>
          <div className='flex flex-wrap justify-center gap-3'>
            <Link
              href='/articles'
              className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              浏览文章
            </Link>
            <button
              onClick={() => mutate()}
              className='inline-flex items-center px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
            >
              重试
            </button>
          </div>
        </BaseCard>
      </div>
    );
  }

  return (
    <div className='space-y-8 dark:text-slate-200'>
      {/* Header */}
      <header className='text-center space-y-2 mb-8 px-4'>
        <PageTitle>待审核内容</PageTitle>
        <PageDescription>
          {canModerate ? '查看并管理所有待审核的文章提交' : '查看您的待审核提交'}
        </PageDescription>
      </header>

      {/* Stats & Filters */}
      <div className='mb-6 px-4'>
        <div className='p-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                共 {data?.total_count || 0} 个待处理项目
              </div>
              {filteredVersions.length !== data?.total_count && (
                <div className='text-sm text-gray-600 dark:text-gray-400'>
                  (显示 {filteredVersions.length} 个)
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <button
                onClick={() => setFilter('all')}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                待审核
              </button>
              {canModerate && (
                <button
                  onClick={() => setFilter('rejected')}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    filter === 'rejected'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  已拒绝
                </button>
              )}

              <button
                onClick={() => mutate()}
                className='px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ml-2'
              >
                刷新
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {canModerate && (
        <div className='mb-6 px-4'>
          <div className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>快速操作</div>
              <div className='flex items-center gap-3'>
                <Link
                  href='/articles/moderation/pending'
                  className='inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm'
                >
                  审核管理
                </Link>
                <Link
                  href='/articles/new'
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                >
                  新建文章
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Versions List */}
      <div className='px-4'>
        {filteredVersions.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-6xl mb-4'>📝</div>
            <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2'>
              {filter === 'all'
                ? '暂无待处理项目'
                : filter === 'pending'
                  ? '暂无待审核项目'
                  : '暂无已拒绝项目'}
            </h3>
            <p className='text-gray-600 dark:text-gray-400 mb-6'>
              {filter === 'all' ? '所有提交都已处理完成' : '尝试切换其他筛选条件查看更多内容'}
            </p>
            <div className='flex flex-wrap justify-center gap-3'>
              <Link
                href='/articles/new'
                className='inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                创建新文章
              </Link>
              <button
                onClick={() => mutate()}
                className='px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
              >
                刷新
              </button>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredVersions.map((version) => (
              <div key={version.preview_token} className='p-6'>
                <div className='flex flex-col lg:flex-row lg:items-start gap-6'>
                  {/* Content Info */}
                  <div className='flex-1'>
                    <div className='flex items-start justify-between mb-4'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                          {version.title}
                        </h3>
                        <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
                          <span>作者: {version.author_nickname || '未知'}</span>
                          <span>编辑者: {version.editor_nickname || '未知'}</span>
                          <span>分类: {version.category_name || '未分类'}</span>
                        </div>
                      </div>
                      {getStatusBadge(version.status)}
                    </div>

                    <div className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
                      提交时间:{' '}
                      {format(new Date(version.created_at), 'yyyy年MM月dd日 HH:mm', {
                        locale: zhCN,
                      })}
                    </div>

                    {/* Content Preview */}
                    <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4'>
                      <div
                        className='prose prose-sm max-w-none dark:prose-invert line-clamp-3'
                        dangerouslySetInnerHTML={{
                          __html:
                            version.content.substring(0, 300) +
                            (version.content.length > 300 ? '...' : ''),
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex flex-col gap-3 lg:w-48'>
                    <Link
                      href={`/articles/preview?token=${version.preview_token}`}
                      className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors text-sm'
                    >
                      预览内容
                    </Link>

                    <Link
                      href={`/articles/${version.article_id}/edit`}
                      className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm'
                    >
                      继续编辑
                    </Link>

                    <Link
                      href={`/articles/${version.article_id}/history`}
                      className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm'
                    >
                      查看历史
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className='mt-8 text-center px-4'>
        <div className='flex flex-wrap justify-center gap-3'>
          <Link
            href='/articles'
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            浏览文章
          </Link>

          <Link
            href='/articles/new'
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            创建文章
          </Link>

          {canModerate && (
            <Link
              href='/articles/moderation/pending'
              className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
            >
              审核管理
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
