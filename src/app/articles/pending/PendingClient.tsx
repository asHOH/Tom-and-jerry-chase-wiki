'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import useSWR from 'swr';
import clsx from 'clsx';

import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import { sanitizeHTML } from '@/lib/xssUtils';

/**
 * Represents a unified article submission.
 */
interface Submission {
  id: string;
  version_id: string;
  article_id: string;
  title: string;
  editor_id?: string;
  editor_nickname?: string;
  author_nickname?: string;
  content: string;
  status: 'pending' | 'rejected' | (string & Record<never, never>);
  created_at: string;
  category_name?: string;
  preview_token?: string;
}

interface SubmissionsData {
  submissions: Submission[];
  count: number;
}

// API response for moderators
interface ModerationApiResponse {
  submissions: Array<Omit<Submission, 'title'> & { article_title: string }>;
  count: number;
}

// API response for regular users
interface UserApiResponse {
  pending_versions: Array<
    Omit<Submission, 'id' | 'version_id' | 'title'> & { title: string; preview_token: string }
  >;
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
  const [processingVersions, setProcessingVersions] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'rejected'>('all');

  const canModerate = userRole === 'Reviewer' || userRole === 'Coordinator';

  const apiEndpoint = useMemo(() => {
    if (canModerate) return '/api/moderation/pending';
    if (userRole === 'Contributor') return '/api/articles/pending';
    return null;
  }, [userRole, canModerate]);

  const {
    data: rawData,
    error,
    mutate,
  } = useSWR<ModerationApiResponse | UserApiResponse>(apiEndpoint, fetcher);

  const data: SubmissionsData | undefined = useMemo(() => {
    if (!rawData) return undefined;

    if ('submissions' in rawData) {
      return {
        submissions: rawData.submissions.map((s) => ({
          ...s,
          title: s.article_title,
        })),
        count: rawData.count,
      };
    }

    if ('pending_versions' in rawData) {
      return {
        submissions: rawData.pending_versions.map((v) => ({
          ...v,
          id: v.preview_token,
          version_id: v.preview_token,
        })),
        count: rawData.total_count,
      };
    }

    return undefined;
  }, [rawData]);

  const loading = !data && !error;

  const handleModerationAction = async (versionId: string, action: 'approve' | 'reject') => {
    if (processingVersions.has(versionId)) return;

    setProcessingVersions((prev) => new Set([...Array.from(prev), versionId]));

    try {
      const response = await fetch(`/api/moderation/${versionId}?action=${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `${action} 操作失败`);
      }

      await mutate();
      alert(`已成功${action === 'approve' ? '批准' : '拒绝'}此提交`);
    } catch (err) {
      console.error(`Error ${action}ing submission:`, err);
      alert(
        `${action === 'approve' ? '批准' : '拒绝'}操作失败: ${err instanceof Error ? err.message : '未知错误'}`
      );
    } finally {
      setProcessingVersions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(versionId);
        return newSet;
      });
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

  const filteredSubmissions =
    data?.submissions.filter((submission) => {
      if (filter === 'all') return true;
      return submission.status === filter;
    }) || [];

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
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>🚫</div>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
            {error.status === 403 || error.status === 401
              ? '您没有权限访问此页面'
              : '加载待审核内容失败'}
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            {userRole === 'Contributor'
              ? '您可以查看自己的待审核提交，但不能进行审核操作'
              : '请检查您的登录状态或联系管理员获取相应权限'}
          </p>
          <Link
            href='/articles'
            className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-2 mb-8 px-4'>
        <PageTitle>{canModerate ? '内容审核' : '待审核内容'}</PageTitle>
        <PageDescription>
          {canModerate ? '管理待审核的文章提交' : '查看您的待审核提交'}
        </PageDescription>
      </header>

      <div className='mb-6'>
        <div className='p-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                共 {data?.count || 0} 个待处理项目
              </div>
              {filteredSubmissions.length !== data?.count && (
                <div className='text-sm text-gray-600 dark:text-gray-400'>
                  (显示 {filteredSubmissions.length} 个)
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

      {filteredSubmissions.length === 0 ? (
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>📝</div>
          <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2'>
            {filter === 'all'
              ? '暂无待处理项目'
              : filter === 'pending'
                ? '暂无待审核项目'
                : '暂无已拒绝项目'}
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>
            {filter === 'all' ? '所有提交都已处理完成' : '尝试切换其他筛选条件查看更多内容'}
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            <Link
              href='/articles'
              className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              返回文章列表
            </Link>
            <button
              onClick={() => mutate()}
              className='inline-flex items-center px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
            >
              刷新
            </button>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredSubmissions.map((submission) => (
            <div key={submission.version_id} className='p-6'>
              <div className='flex flex-col lg:flex-row lg:items-start gap-6'>
                <div className='flex-1'>
                  <div className='flex items-start justify-between mb-4'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                        {submission.title}
                      </h3>
                      <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
                        <span>作者: {submission.author_nickname || '未知'}</span>
                        <span>编辑者: {submission.editor_nickname || '未知'}</span>
                        <span>分类: {submission.category_name || '未分类'}</span>
                      </div>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>

                  <div className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
                    提交时间:{' '}
                    {format(new Date(submission.created_at), 'yyyy年MM月dd日 HH:mm', {
                      locale: zhCN,
                    })}
                  </div>

                  <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4'>
                    <div
                      className='prose prose-sm max-w-none dark:prose-invert line-clamp-3'
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHTML(
                          submission.content.substring(0, 300) +
                            (submission.content.length > 300 ? '...' : '')
                        ),
                      }}
                    />
                  </div>
                </div>

                <div className='flex flex-col gap-3 lg:w-48'>
                  <Link
                    href={`/articles/preview?token=${
                      submission.preview_token || submission.version_id
                    }`}
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

                  {canModerate && submission.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleModerationAction(submission.version_id, 'approve')}
                        disabled={processingVersions.has(submission.version_id)}
                        className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm'
                      >
                        {processingVersions.has(submission.version_id) ? (
                          <LoadingSpinner size='sm' />
                        ) : (
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
                              d='M4.5 12.75l6 6 9-13.5'
                            />
                          </svg>
                        )}
                        批准
                      </button>

                      <button
                        onClick={() => handleModerationAction(submission.version_id, 'reject')}
                        disabled={processingVersions.has(submission.version_id)}
                        className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm'
                      >
                        {processingVersions.has(submission.version_id) ? (
                          <LoadingSpinner size='sm' />
                        ) : (
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
                              d='M6 18L18 6M6 6l12 12'
                            />
                          </svg>
                        )}
                        拒绝
                      </button>
                    </>
                  )}

                  {!canModerate && (
                    <Link
                      href={`/articles/${submission.article_id}/edit`}
                      className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm'
                    >
                      继续编辑
                    </Link>
                  )}

                  <Link
                    href={`/articles/${submission.article_id}/history`}
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
            </div>
          ))}
        </div>
      )}

      <div className='mt-8 text-center'>
        <div className='flex flex-wrap justify-center gap-3'>
          <Link
            href='/articles'
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            返回文章列表
          </Link>

          {canModerate && (
            <Link
              href='/admin/users'
              className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
            >
              用户管理
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
