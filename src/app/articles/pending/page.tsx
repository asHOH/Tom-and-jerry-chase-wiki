'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import PageTitle from '@/components/ui/PageTitle';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';

interface PendingVersion {
  id: string;
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

export default function PendingModerationPage() {
  const { role: userRole } = useUser();
  const [data, setData] = useState<PendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'rejected'>('all');

  useEffect(() => {
    fetchPendingVersions();
  }, []);

  const fetchPendingVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/articles/pending');

      if (!response.ok) {
        if (response.status === 401) {
          setError('请先登录查看待审核内容');
        } else {
          setError('加载待审核内容失败');
        }
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching pending versions:', err);
      setError('加载待审核内容时发生错误');
    } finally {
      setLoading(false);
    }
  };

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
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

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

  if (loading) {
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
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2'>{error}</h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>请检查您的登录状态或联系管理员</p>
          <div className='flex flex-wrap justify-center gap-3'>
            <Link
              href='/articles'
              className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              浏览文章
            </Link>
            <button
              onClick={fetchPendingVersions}
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
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      {/* Header */}
      <div className='mb-8'>
        <PageTitle>待审核内容</PageTitle>
        <p className='mt-2 text-gray-600 dark:text-gray-400'>
          {canModerate ? '查看和管理所有待审核的文章提交' : '查看您的待审核提交'}
        </p>
      </div>

      {/* Stats & Filters */}
      <div className='mb-6'>
        <BaseCard className='p-6'>
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

            {/* Filter Buttons */}
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                待审核
              </button>
              {canModerate && (
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === 'rejected'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  已拒绝
                </button>
              )}

              <button
                onClick={fetchPendingVersions}
                className='px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ml-2'
              >
                刷新
              </button>
            </div>
          </div>
        </BaseCard>
      </div>

      {/* Quick Actions */}
      {canModerate && (
        <div className='mb-6'>
          <BaseCard className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>快速操作</div>
              <div className='flex items-center gap-3'>
                <Link
                  href='/articles/moderation/pending'
                  className='inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm'
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
                      d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  审核管理
                </Link>
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
              </div>
            </div>
          </BaseCard>
        </div>
      )}

      {/* Pending Versions List */}
      {filteredVersions.length === 0 ? (
        <BaseCard className='text-center py-12'>
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
          <Link
            href='/articles/new'
            className='inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
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
            创建新文章
          </Link>
        </BaseCard>
      ) : (
        <div className='space-y-4'>
          {filteredVersions.map((version) => (
            <BaseCard key={version.id} className='p-6'>
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
                    {format(new Date(version.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
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
                    href={`/articles/preview?token=${version.id}`}
                    className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors text-sm'
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
                        d='M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
                      />
                    </svg>
                    预览内容
                  </Link>

                  <Link
                    href={`/articles/${version.article_id}/edit`}
                    className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm'
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
                        d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10'
                      />
                    </svg>
                    继续编辑
                  </Link>

                  <Link
                    href={`/articles/${version.article_id}/history`}
                    className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm'
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
                    查看历史
                  </Link>
                </div>
              </div>
            </BaseCard>
          ))}
        </div>
      )}

      {/* Footer Navigation */}
      <div className='mt-8 text-center'>
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
