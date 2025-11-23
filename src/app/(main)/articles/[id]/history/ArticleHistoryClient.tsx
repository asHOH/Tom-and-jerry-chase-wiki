'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';

import { formatArticleDate } from '@/lib/dateUtils';
import { useUser } from '@/hooks/useUser';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageTitle from '@/components/ui/PageTitle';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import { ClockIcon, UserCircleIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

interface ArticleVersion {
  id: string;
  content: string;
  created_at: string;
  editor_id: string;
  status: 'approved' | 'pending' | 'rejected' | 'revoked';
  users: { nickname: string };
}

interface ArticleHistoryData {
  article: {
    id: string;
    title: string;
    categories: { name: string };
  };
  versions: ArticleVersion[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ArticleHistoryClient() {
  const params = useParams();
  const { role: userRole } = useUser();
  const articleId = params?.id as string;

  const { data, error } = useSWR<ArticleHistoryData>(
    articleId ? `/api/articles/${articleId}/history` : null,
    fetcher
  );

  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const loading = !data && !error;

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        // Replace the first selected version with the new one
        const secondVersion = prev[1];
        return secondVersion ? [secondVersion, versionId] : [versionId];
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        text: '已发布',
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        text: '待审核',
      },
      rejected: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        text: '已拒绝',
      },
      revoked: {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        text: '已撤销',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.approved;

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const canRevoke = userRole === 'Reviewer' || userRole === 'Coordinator';

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
        <BaseCard className='py-12 text-center'>
          <div className='mb-4 text-6xl'>📚</div>
          <h2 className='mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200'>
            {error ? '加载历史版本失败' : '历史版本未找到'}
          </h2>
          <p className='mb-6 text-gray-600 dark:text-gray-400'>无法加载此文章的历史版本</p>
          <Link
            href={`/articles/${articleId}`}
            className='inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
          >
            返回文章
          </Link>
        </BaseCard>
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-6xl px-4 py-8'>
      {/* Header */}
      <header className='mb-8 text-center'>
        {/* <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4'>
          <Link
            href={`/articles/${articleId}`}
            className='hover:text-blue-600 dark:hover:text-blue-400'
          >
            {data.article.title}
          </Link>
          <span>/</span>
          <span>历史版本</span>
        </div> */}

        <PageTitle>版本历史</PageTitle>

        <div className='mt-4 text-gray-600 dark:text-gray-400'>
          <p>分类: {data.article.categories?.name || '未分类'}</p>
          <p className='mt-1'>共 {data.versions.length} 个版本</p>
        </div>
      </header>

      {/* Comparison Actions */}
      {selectedVersions.length === 2 && (
        <BaseCard className='mb-6 p-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              已选择 {selectedVersions.length} 个版本进行比较
            </div>
            <div className='flex gap-3'>
              <button
                onClick={() => setSelectedVersions([])}
                className='px-4 py-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              >
                清除选择
              </button>
              <button
                className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
                onClick={() => {
                  // TODO: Implement diff viewer
                  alert('差异比较功能即将推出');
                }}
              >
                比较差异
              </button>
            </div>
          </div>
        </BaseCard>
      )}

      {/* Version List */}
      <div className='space-y-4'>
        {data.versions.map((version, index) => (
          <div key={version.id} className='p-6'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='mb-3 flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    {/* Version Selection Checkbox */}
                    <input
                      type='checkbox'
                      checked={selectedVersions.includes(version.id)}
                      onChange={() => handleVersionSelect(version.id)}
                      className='h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600'
                      disabled={
                        !selectedVersions.includes(version.id) && selectedVersions.length >= 2
                      }
                      aria-label={`选择版本 #${data.versions.length - index}`}
                    />

                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      版本 #{data.versions.length - index}
                    </h3>
                  </div>

                  {getStatusBadge(version.status)}

                  {index === 0 && version.status === 'approved' && (
                    <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'>
                      当前版本
                    </span>
                  )}
                </div>

                <div className='mb-4 flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400'>
                  <div className='flex items-center gap-2'>
                    <UserCircleIcon className='size-4' strokeWidth={1.5} />
                    <span>编辑者: {version.users?.nickname || '未知用户'}</span>
                  </div>

                  <div className='flex items-center gap-2'>
                    <ClockIcon className='size-4' strokeWidth={1.5} />
                    <span>{formatArticleDate(version.created_at)}</span>
                  </div>
                </div>

                {/* Content Preview */}
                <div className='text-sm text-gray-700 dark:text-gray-300'>
                  <RichTextDisplay content={version.content} preview />
                </div>
              </div>

              {/* Actions */}
              <div className='ml-4 flex flex-col gap-2'>
                <Link
                  href={`/articles/${articleId}?version=${version.id}`}
                  className='rounded bg-gray-100 px-3 py-1.5 text-center text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                >
                  查看完整版本
                </Link>

                {canRevoke && version.status === 'approved' && index === 0 && (
                  <button
                    onClick={async () => {
                      if (confirm('确定要撤销这个版本吗？这将回退到上一个已发布的版本。')) {
                        try {
                          const response = await fetch(
                            `/api/moderation/${version.id}?action=revoke`,
                            {
                              method: 'POST',
                            }
                          );

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || '撤销操作失败');
                          }

                          alert('版本已成功撤销');
                          // Refresh the history data
                          window.location.reload();
                        } catch (err) {
                          console.error('Error revoking version:', err);
                          alert(`撤销操作失败: ${err instanceof Error ? err.message : '未知错误'}`);
                        }
                      }
                    }}
                    className='rounded bg-red-100 px-3 py-1.5 text-center text-sm text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                  >
                    撤销版本
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className='mt-8 text-center'>
        <div className='flex flex-wrap justify-center gap-3'>
          <Link
            href={`/articles/${articleId}`}
            className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
          >
            返回文章
          </Link>

          <Link
            href='/articles'
            className='px-4 py-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            浏览更多文章
          </Link>
        </div>
      </div>
    </div>
  );
}
