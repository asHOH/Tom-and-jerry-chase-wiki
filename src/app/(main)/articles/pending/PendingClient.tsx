'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import useSWR from 'swr';

import { formatArticleDate } from '@/lib/dateUtils';
import { useUser } from '@/hooks/useUser';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import { CheckBadgeIcon, ClockIcon, CloseIcon, EyeIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

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
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
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
        <div className='flex min-h-[400px] items-center justify-center'>
          <LoadingSpinner size='lg' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='py-12 text-center'>
          <div className='mb-4 text-6xl'>🚫</div>
          <h2 className='mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200'>
            {error.status === 403 || error.status === 401
              ? '您没有权限访问此页面'
              : '加载待审核内容失败'}
          </h2>
          <p className='mb-6 text-gray-600 dark:text-gray-400'>
            {userRole === 'Contributor'
              ? '您可以查看自己的待审核提交，但不能进行审核操作'
              : '请检查您的登录状态或联系管理员获取相应权限'}
          </p>
          <Link
            href='/articles'
            className='inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
          >
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 dark:text-slate-200'>
      <header className='mb-8 space-y-2 px-4 text-center'>
        <PageTitle>{canModerate ? '内容审核' : '待审核内容'}</PageTitle>
        <PageDescription>
          {canModerate ? '管理待审核的文章提交' : '查看您的待审核提交'}
        </PageDescription>
      </header>

      <div className='mb-6'>
        <div className='p-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
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
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                待审核
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  filter === 'rejected'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                已拒绝
              </button>

              <button
                onClick={() => mutate()}
                className='ml-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              >
                刷新
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className='py-12 text-center'>
          <div className='mb-4 text-6xl'>📝</div>
          <h3 className='mb-2 text-xl font-semibold text-gray-800 dark:text-gray-200'>
            {filter === 'all'
              ? '暂无待处理项目'
              : filter === 'pending'
                ? '暂无待审核项目'
                : '暂无已拒绝项目'}
          </h3>
          <p className='mb-4 text-gray-600 dark:text-gray-400'>
            {filter === 'all' ? '所有提交都已处理完成' : '尝试切换其他筛选条件查看更多内容'}
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            <Link
              href='/articles'
              className='inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
            >
              返回文章列表
            </Link>
            <button
              onClick={() => mutate()}
              className='inline-flex items-center rounded-lg bg-gray-100 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            >
              刷新
            </button>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredSubmissions.map((submission) => (
            <div key={submission.version_id} className='p-6'>
              <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
                <div className='flex-1'>
                  <div className='mb-4 flex items-start justify-between'>
                    <div>
                      <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
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

                  <div className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
                    提交时间: {formatArticleDate(submission.created_at)}
                  </div>

                  <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
                    <RichTextDisplay content={submission.content} preview />
                  </div>
                </div>

                <div className='flex flex-col gap-3 lg:w-48'>
                  <Link
                    href={`/articles/preview?token=${
                      submission.preview_token || submission.version_id
                    }`}
                    className='inline-flex items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40'
                  >
                    <EyeIcon className='size-4' strokeWidth={1.5} />
                    预览内容
                  </Link>

                  {canModerate && submission.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleModerationAction(submission.version_id, 'approve')}
                        disabled={processingVersions.has(submission.version_id)}
                        className='inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50'
                      >
                        {processingVersions.has(submission.version_id) ? (
                          <LoadingSpinner size='sm' />
                        ) : (
                          <CheckBadgeIcon className='size-4' strokeWidth={1.5} />
                        )}
                        批准
                      </button>

                      <button
                        onClick={() => handleModerationAction(submission.version_id, 'reject')}
                        disabled={processingVersions.has(submission.version_id)}
                        className='inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
                      >
                        {processingVersions.has(submission.version_id) ? (
                          <LoadingSpinner size='sm' />
                        ) : (
                          <CloseIcon className='size-4' strokeWidth={1.5} />
                        )}
                        拒绝
                      </button>
                    </>
                  )}

                  {!canModerate && (
                    <Link
                      href={`/articles/${submission.article_id}/edit`}
                      className='inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    >
                      继续编辑
                    </Link>
                  )}

                  <Link
                    href={`/articles/${submission.article_id}/history`}
                    className='inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  >
                    <ClockIcon className='size-4' strokeWidth={1.5} />
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
            className='px-4 py-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            返回文章列表
          </Link>

          {canModerate && (
            <Link
              href='/admin/users'
              className='px-4 py-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            >
              用户管理
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
