'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import PageTitle from '@/components/ui/PageTitle';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';

interface ArticleVersion {
  id: string;
  content: string;
  created_at: string;
  editor_id: string;
  status: 'approved' | 'pending' | 'rejected' | 'revoked';
  users_public_view: { nickname: string };
}

interface ArticleHistoryData {
  article: {
    id: string;
    title: string;
    categories: { name: string };
  };
  versions: ArticleVersion[];
}

export default function ArticleHistoryClient() {
  const params = useParams();
  const { role: userRole } = useUser();
  const articleId = params?.id as string;

  const [data, setData] = useState<ArticleHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!articleId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/articles/${articleId}/history`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('文章未找到');
          } else {
            setError('加载历史版本失败');
          }
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching article history:', err);
        setError('加载历史版本时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [articleId]);

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
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const canRevoke = userRole === 'Reviewer' || userRole === 'Coordinator';

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
        <BaseCard className='text-center py-12'>
          <div className='text-6xl mb-4'>📚</div>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
            {error || '历史版本未找到'}
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>无法加载此文章的历史版本</p>
          <Link
            href={`/articles/${articleId}`}
            className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            返回文章
          </Link>
        </BaseCard>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4'>
          <Link
            href={`/articles/${articleId}`}
            className='hover:text-blue-600 dark:hover:text-blue-400'
          >
            {data.article.title}
          </Link>
          <span>/</span>
          <span>历史版本</span>
        </div>

        <PageTitle>版本历史</PageTitle>

        <div className='mt-4 text-gray-600 dark:text-gray-400'>
          <p>分类: {data.article.categories?.name || '未分类'}</p>
          <p className='mt-1'>共 {data.versions.length} 个版本</p>
        </div>
      </div>

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
                className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
              >
                清除选择
              </button>
              <button
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
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
          <BaseCard key={version.id} className='p-6'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-4 mb-3'>
                  <div className='flex items-center gap-2'>
                    {/* Version Selection Checkbox */}
                    <input
                      type='checkbox'
                      checked={selectedVersions.includes(version.id)}
                      onChange={() => handleVersionSelect(version.id)}
                      className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                      disabled={
                        !selectedVersions.includes(version.id) && selectedVersions.length >= 2
                      }
                    />

                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      版本 #{data.versions.length - index}
                    </h3>
                  </div>

                  {getStatusBadge(version.status)}

                  {index === 0 && version.status === 'approved' && (
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'>
                      当前版本
                    </span>
                  )}
                </div>

                <div className='flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4'>
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
                    <span>编辑者: {version.users_public_view?.nickname || '未知用户'}</span>
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
                      {format(new Date(version.created_at), 'yyyy年MM月dd日 HH:mm', {
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                </div>

                {/* Content Preview */}
                <div className='text-gray-700 dark:text-gray-300 text-sm'>
                  <div
                    className='line-clamp-3 prose prose-sm max-w-none dark:prose-invert'
                    dangerouslySetInnerHTML={{
                      __html:
                        version.content.substring(0, 200) +
                        (version.content.length > 200 ? '...' : ''),
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-2 ml-4'>
                <Link
                  href={`/articles/${articleId}?version=${version.id}`}
                  className='px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center'
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
                    className='px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-center'
                  >
                    撤销版本
                  </button>
                )}
              </div>
            </div>
          </BaseCard>
        ))}
      </div>

      {/* Footer */}
      <div className='mt-8 text-center'>
        <div className='flex flex-wrap justify-center gap-3'>
          <Link
            href={`/articles/${articleId}`}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            返回文章
          </Link>

          <Link
            href='/articles'
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            浏览更多文章
          </Link>
        </div>
      </div>
    </div>
  );
}
