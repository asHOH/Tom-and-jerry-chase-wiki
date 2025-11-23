'use client';

import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { formatArticleDate } from '@/lib/dateUtils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageTitle from '@/components/ui/PageTitle';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import {
  ClockIcon,
  EyeIcon,
  FolderIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

interface PreviewData {
  is_preview: boolean;
  preview_token: string;
  article: {
    id: string;
    title: string;
    categories: { name: string };
    users_public_view: { nickname: string };
    version: {
      content: string;
      status: 'pending' | 'approved' | 'rejected' | 'revoked';
      created_at: string;
      editor: {
        nickname: string;
      };
    };
  };
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

export default function PreviewClient() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const { data: previewData, error } = useSWR<{ preview: PreviewData }>(
    token ? `/api/articles/preview?token=${encodeURIComponent(token)}` : null,
    fetcher
  );

  const data = previewData?.preview;
  const loading = !previewData && !error;

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex min-h-[400px] items-center justify-center'>
          <LoadingSpinner size='lg' />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='py-12 text-center'>
          <div className='mb-4 text-6xl'>🔗</div>
          <h2 className='mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200'>
            {error ? '加载预览失败' : '预览不可用'}
          </h2>
          <p className='mb-6 text-gray-600 dark:text-gray-400'>
            此预览链接可能无效、已过期或文章已被删除
          </p>
          <Link
            href='/'
            className='inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        text: '待审核',
        description: '此版本正在等待审核，尚未公开发布',
      },
      approved: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        text: '已发布',
        description: '此版本已经审核通过并公开发布',
      },
      rejected: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        text: '已拒绝',
        description: '此版本已被拒绝，不会公开发布',
      },
      revoked: {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        text: '已撤销',
        description: '此版本已被撤销，不再公开显示',
      },
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const statusInfo = getStatusInfo(data.article.version.status);

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      {/* Preview Banner */}
      <div className='mb-6'>
        <div
          className={`border-l-4 p-4 ${
            statusInfo.color.includes('yellow')
              ? 'border-yellow-400'
              : statusInfo.color.includes('green')
                ? 'border-green-400'
                : statusInfo.color.includes('red')
                  ? 'border-red-400'
                  : 'border-gray-400'
          }`}
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='mb-2 flex items-center gap-3'>
                <EyeIcon className='size-5 text-orange-500' strokeWidth={1.5} />
                <span className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  文章预览
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusInfo.color}`}
                >
                  {statusInfo.text}
                </span>
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>{statusInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <header className='mb-8 text-center'>
        <PageTitle>{data.article.title}</PageTitle>

        {/* Article Meta */}
        <div className='mt-6 p-6'>
          <div className='flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400'>
            <div className='flex items-center gap-2'>
              <UserCircleIcon className='size-4' strokeWidth={1.5} />
              <span>作者: {data.article.users_public_view.nickname || '未知用户'}</span>
            </div>

            <div className='flex items-center gap-2'>
              <FolderIcon className='size-4' strokeWidth={1.5} />
              <span>分类: {data.article.categories?.name || '未分类'}</span>
            </div>

            <div className='flex items-center gap-2'>
              <PencilSquareIcon className='size-4' strokeWidth={1.5} />
              <span>编辑者: {data.article.version.editor.nickname || '未知用户'}</span>
            </div>

            <div className='flex items-center gap-2'>
              <ClockIcon className='size-4' strokeWidth={1.5} />
              <span>编辑时间: {formatArticleDate(data.article.version.created_at)}</span>
            </div>
          </div>

          {/* Quick Actions */}
          {data.article.version.status === 'approved' && (
            <div className='mt-4 border-t border-gray-200 pt-4 dark:border-gray-700'>
              <Link
                href={`/articles/${data.article.id}`}
                className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
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
                    d='M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'
                  />
                </svg>
                查看正式发布版本
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Article Content */}
      <div className='p-8'>
        <RichTextDisplay content={data.article.version.content} />
      </div>

      {/* Footer Notice */}
      <div className='mt-8 text-center'>
        <div className='border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20'>
          <div className='flex items-center justify-center gap-2 text-sm text-orange-800 dark:text-orange-300'>
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
                d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
              />
            </svg>
            <span>这是一个预览页面，显示的内容可能与最终发布版本不同</span>
          </div>
        </div>

        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Link
            href='/'
            className='px-4 py-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            返回首页
          </Link>

          <Link
            href='/articles'
            className='px-4 py-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            浏览文章
          </Link>
        </div>
      </div>
    </div>
  );
}
