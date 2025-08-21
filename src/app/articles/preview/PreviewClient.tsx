'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import useSWR from 'swr';

import PageTitle from '@/components/ui/PageTitle';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
        <div className='flex items-center justify-center min-h-[400px]'>
          <LoadingSpinner size='lg' />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>🔗</div>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
            {error ? '加载预览失败' : '预览不可用'}
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            此预览链接可能无效、已过期或文章已被删除
          </p>
          <Link
            href='/'
            className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
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
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      {/* Preview Banner */}
      <div className='mb-6'>
        <div
          className={`p-4 border-l-4 ${
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
              <div className='flex items-center gap-3 mb-2'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='size-5 text-orange-500'
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
                <span className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  文章预览
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
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
                  d='M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
                />
              </svg>
              <span>作者: {data.article.users_public_view.nickname || '未知用户'}</span>
            </div>

            <div className='flex items-center gap-2'>
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
                  d='M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z'
                />
              </svg>
              <span>分类: {data.article.categories?.name || '未分类'}</span>
            </div>

            <div className='flex items-center gap-2'>
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
                  d='m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10'
                />
              </svg>
              <span>编辑者: {data.article.version.editor.nickname || '未知用户'}</span>
            </div>

            <div className='flex items-center gap-2'>
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
              <span>
                编辑时间:{' '}
                {format(new Date(data.article.version.created_at), 'yyyy年MM月dd日 HH:mm', {
                  locale: zhCN,
                })}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          {data.article.version.status === 'approved' && (
            <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <Link
                href={`/articles/${data.article.id}`}
                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
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
        <div
          className='prose prose-lg max-w-none dark:prose-invert prose-blue
                     prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                     prose-p:text-gray-700 dark:prose-p:text-gray-300
                     prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                     prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                     prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                     prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700
                     prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:px-4
                     prose-ul:list-disc prose-ol:list-decimal
                     prose-li:text-gray-700 dark:prose-li:text-gray-300'
          dangerouslySetInnerHTML={{
            __html: data.article.version.content || '<p>内容加载中...</p>',
          }}
        />
      </div>

      {/* Footer Notice */}
      <div className='mt-8 text-center'>
        <div className='p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'>
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

        <div className='flex flex-wrap justify-center gap-3 mt-6'>
          <Link
            href='/'
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            返回首页
          </Link>

          <Link
            href='/articles'
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            浏览文章
          </Link>
        </div>
      </div>
    </div>
  );
}
