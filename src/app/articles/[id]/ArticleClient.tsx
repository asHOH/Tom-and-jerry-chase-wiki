'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
// import useSWR from 'swr';
// import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import { useMobile } from '@/hooks/useMediaQuery';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import {
  ClockIcon,
  EyeIcon,
  FolderIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@/components/icons/CommonIcons';

interface ArticleData {
  id: string;
  title: string;
  category_id: string;
  author_id: string;
  created_at: string;
  view_count?: number;
  categories: { name: string };
  users_public_view: { nickname: string | null } | null;
  latest_version: {
    id: string | null;
    content: string | null;
    created_at: string | null;
    editor_id: string | null;
    users_public_view: { nickname: string | null } | null;
  };
}

// const fetcher = (url: string) =>
//   fetch(url).then((res) => {
//     if (!res.ok) {
//       const error = new Error('An error occurred while fetching the data.') as Error & {
//         info: unknown;
//         status: number;
//       };
//       error.info = res.json();
//       error.status = res.status;
//       throw error;
//     }
//     return res.json();
//   });

export default function ArticleClient({ article }: { article: ArticleData }) {
  const params = useParams();
  const { role: userRole } = useUser();
  const articleId = params?.id as string;
  const isMobile = useMobile();

  // const { data, error } = useSWR<{ article: ArticleData }>(
  //   articleId ? `/api/articles/${articleId}` : null,
  //   fetcher
  // );

  // console.log({ data });

  // const article = data?.article;
  // const loading = !data && !error;

  // if (loading) {
  //   return (
  //     <div className='container mx-auto px-4 py-8'>
  //       <div className='flex items-center justify-center min-h-[400px]'>
  //         <LoadingSpinner size='lg' />
  //       </div>
  //     </div>
  //   );
  // }

  // if (error || !article) {
  //   return (
  //     <div className='container mx-auto px-4 py-8'>
  //       <div className='text-center py-12'>
  //         <div className='text-6xl mb-4'>📄</div>
  //         <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
  //           {error ? '加载文章失败' : '文章未找到'}
  //         </h2>
  //         <p className='text-gray-600 dark:text-gray-400 mb-6'>
  //           请检查链接是否正确，或返回首页浏览其他内容
  //         </p>
  //         <Link
  //           href='/'
  //           className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
  //         >
  //           返回首页
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  const canEdit =
    userRole === 'Contributor' || userRole === 'Reviewer' || userRole === 'Coordinator';
  const titleSize = !isMobile ? 'text-4xl' : article.title.length <= 10 ? 'text-3xl' : 'text-2xl';

  return (
    <div className={`container mx-auto ${isMobile ? 'px-1 py-2' : 'px-4 py-8'} max-w-4xl`}>
      {/* Header */}
      <div className='mb-8 flex flex-col'>
        <header className='text-center'>
          <h1 className={`${titleSize} font-bold text-blue-600 dark:text-blue-400 py-3`}>
            {article.title}
          </h1>
        </header>

        {/* Article Meta */}
        <div className={isMobile ? 'p-2' : 'mt-6 p-6'}>
          <div className='flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400'>
            <div className='flex items-center gap-2'>
              <UserCircleIcon className='size-4' strokeWidth={1.5} />
              <span>作者: {article.users_public_view?.nickname || '未知用户'}</span>
            </div>

            <div className='flex items-center gap-2'>
              <FolderIcon className='size-4' strokeWidth={1.5} />

              <span>分类: {article.categories?.name || '未分类'}</span>
            </div>

            <div className='flex items-center gap-2'>
              <ClockIcon className='size-4' strokeWidth={1.5} />
              <span>
                创建于:{' '}
                {format(new Date(article.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </span>
            </div>

            <div className='flex items-center gap-2'>
              <EyeIcon className='size-4' strokeWidth={1.5} />

              <span>浏览: {article.view_count ?? 0}</span>
            </div>

            {article.latest_version && (
              <div className='flex items-center gap-2'>
                <PencilSquareIcon className='size-4' strokeWidth={1.5} />

                <span>
                  最后编辑:{' '}
                  {format(new Date(article.latest_version.created_at!), 'yyyy年MM月dd日 HH:mm', {
                    locale: zhCN,
                  })}
                  {article.latest_version.users_public_view?.nickname &&
                    ` 由 ${article.latest_version.users_public_view.nickname}`}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <Link
              href={`/articles/${articleId}/history`}
              className='inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
            >
              <ClockIcon className='size-4' strokeWidth={1.5} />
              查看历史版本
            </Link>

            {canEdit && (
              <Link
                href={`/articles/${articleId}/edit`}
                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <PencilSquareIcon className='size-4' strokeWidth={1.5} />
                编辑文章
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className={isMobile ? '' : 'p-8'}>
        <RichTextDisplay content={article.latest_version?.content} />
      </div>

      {/* Footer Actions */}
      <div className='mt-8 text-center'>
        <div className='flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4'>
          <EyeIcon className='size-4' strokeWidth={1.5} />

          <span>正在查看已发布版本</span>
        </div>

        <div className='flex flex-wrap justify-center gap-3'>
          <Link
            href='/articles'
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            浏览更多文章
          </Link>

          {canEdit && (
            <Link
              href='/articles/new'
              className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
            >
              创建新文章
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
