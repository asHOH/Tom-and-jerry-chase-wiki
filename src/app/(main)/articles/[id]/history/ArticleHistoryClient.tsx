'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import { formatArticleDate } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { useToast } from '@/context/ToastContext';
import ArticleDiffViewer from '@/features/articles/components/ArticleDiffViewer';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageTitle from '@/components/ui/PageTitle';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import { ClockIcon, UserCircleIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

interface ArticleVersion {
  id: string;
  content: string | null;
  created_at: string | null;
  editor_id: string | null;
  status: string | null;
  commit_message: string | null;
  users: { nickname: string | null } | null;
}

interface ArticleHistoryData {
  article: {
    id: string;
    title: string;
    categories: { name: string } | null;
  };
  versions: ArticleVersion[];
  total_count: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ArticleHistoryClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const permissions = usePermissions();
  const { success, error: showError } = useToast();
  const articleId = params?.id as string;

  const { data, error } = useSWR<ArticleHistoryData>(
    articleId ? `/api/articles/${articleId}/history` : null,
    fetcher
  );

  const [selectedVersions, setSelectedVersions] = useState<{
    oldId: string | null;
    newId: string | null;
  }>({ oldId: null, newId: null });

  const loading = !data && !error;

  const requestedOldId = searchParams.get('oldid');
  const requestedNewId = searchParams.get('diff');
  const hasComparisonParams = requestedOldId !== null || requestedNewId !== null;

  const comparison = useMemo(() => {
    if (!data || !requestedOldId || !requestedNewId) return null;
    const oldIndex = data.versions.findIndex((version) => version.id === requestedOldId);
    const newIndex = data.versions.findIndex((version) => version.id === requestedNewId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex <= newIndex) return null;

    return {
      oldIndex,
      newIndex,
      oldVersion: data.versions[oldIndex]!,
      newVersion: data.versions[newIndex]!,
    };
  }, [data, requestedNewId, requestedOldId]);

  useEffect(() => {
    if (!data || data.versions.length < 2 || hasComparisonParams) return;
    setSelectedVersions((current) => {
      const oldIndex = data.versions.findIndex((version) => version.id === current.oldId);
      const newIndex = data.versions.findIndex((version) => version.id === current.newId);
      if (oldIndex > newIndex && newIndex >= 0) return current;
      return { oldId: data.versions[1]!.id, newId: data.versions[0]!.id };
    });
  }, [data, hasComparisonParams]);

  useEffect(() => {
    if (!data || !hasComparisonParams || comparison) return;
    showError('无法比较所选版本，请重新选择两个有效的历史版本');
    router.replace(`/articles/${articleId}/history`);
  }, [articleId, comparison, data, hasComparisonParams, router, showError]);

  const selectedOldIndexValue = data?.versions.findIndex(
    (version) => version.id === selectedVersions.oldId
  );
  const selectedNewIndexValue = data?.versions.findIndex(
    (version) => version.id === selectedVersions.newId
  );
  const selectedOldIndex =
    selectedOldIndexValue !== undefined && selectedOldIndexValue >= 0
      ? selectedOldIndexValue
      : undefined;
  const selectedNewIndex =
    selectedNewIndexValue !== undefined && selectedNewIndexValue >= 0
      ? selectedNewIndexValue
      : undefined;

  const compareSelectedVersions = () => {
    if (!selectedVersions.oldId || !selectedVersions.newId) return;
    const query = new URLSearchParams({
      oldid: selectedVersions.oldId,
      diff: selectedVersions.newId,
    });
    router.push(`/articles/${articleId}/history?${query.toString()}`);
  };

  const getStatusBadge = (status: string | null) => {
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
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          config.color
        )}
      >
        {config.text}
      </span>
    );
  };

  const canRevoke = permissions.has('article_version.revoke');

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex min-h-100 items-center justify-center'>
          <LoadingSpinner size='lg' />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card className='py-12 text-center'>
          <div className='mb-4 text-6xl'>📚</div>
          <h2 className='mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200'>
            {error ? '加载历史版本失败' : '历史版本未找到'}
          </h2>
          <p className='mb-6 text-gray-600 dark:text-gray-400'>无法加载此文章的历史版本</p>
          <ButtonLink href={`/articles/${articleId}`}>返回文章</ButtonLink>
        </Card>
      </div>
    );
  }

  if (comparison) {
    const olderVersion = data.versions[comparison.oldIndex + 1];
    const newerVersion = data.versions[comparison.newIndex - 1];
    const comparisonHref = (oldId: string, newId: string) => {
      const query = new URLSearchParams({ oldid: oldId, diff: newId });
      return `/articles/${articleId}/history?${query.toString()}`;
    };

    return (
      <div className='container mx-auto max-w-7xl px-4 py-8'>
        <header className='mb-8 text-center'>
          <PageTitle>版本差异</PageTitle>
          <p className='mt-4 text-gray-600 dark:text-gray-400'>{data.article.title}</p>
        </header>

        <ArticleDiffViewer
          key={`${comparison.oldVersion.id}-${comparison.newVersion.id}`}
          articleId={articleId}
          oldVersion={comparison.oldVersion}
          newVersion={comparison.newVersion}
          oldVersionNumber={data.versions.length - comparison.oldIndex}
          newVersionNumber={data.versions.length - comparison.newIndex}
          {...(olderVersion
            ? {
                olderComparisonHref: comparisonHref(olderVersion.id, comparison.oldVersion.id),
              }
            : {})}
          {...(newerVersion
            ? {
                newerComparisonHref: comparisonHref(comparison.newVersion.id, newerVersion.id),
              }
            : {})}
        />
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
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
      {data.versions.length >= 2 && (
        <Card className='mb-6 p-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              请选择一个旧版本和一个新版本进行比较
            </div>
            <Button
              onClick={compareSelectedVersions}
              disabled={!selectedVersions.oldId || !selectedVersions.newId}
            >
              比较选中的版本
            </Button>
          </div>
        </Card>
      )}

      {/* Version List */}
      <div className='space-y-4'>
        {data.versions.map((version, index) => (
          <div key={version.id} className='p-6'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='mb-3 flex flex-wrap items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      版本 #{data.versions.length - index}
                    </h3>
                  </div>

                  {data.versions.length >= 2 && (
                    <fieldset className='flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300'>
                      <legend className='sr-only'>选择版本 #{data.versions.length - index}</legend>
                      <label className='flex items-center gap-1.5'>
                        <input
                          type='radio'
                          name='old-version'
                          checked={selectedVersions.oldId === version.id}
                          onChange={() =>
                            setSelectedVersions((current) => ({
                              ...current,
                              oldId: version.id,
                            }))
                          }
                          disabled={selectedNewIndex !== undefined && index <= selectedNewIndex}
                          className='size-4 border-gray-300 text-orange-600 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700'
                          aria-label={`选择版本 #${data.versions.length - index} 作为旧版本`}
                        />
                        旧
                      </label>
                      <label className='flex items-center gap-1.5'>
                        <input
                          type='radio'
                          name='new-version'
                          checked={selectedVersions.newId === version.id}
                          onChange={() =>
                            setSelectedVersions((current) => ({
                              ...current,
                              newId: version.id,
                            }))
                          }
                          disabled={selectedOldIndex !== undefined && index >= selectedOldIndex}
                          className='size-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700'
                          aria-label={`选择版本 #${data.versions.length - index} 作为新版本`}
                        />
                        新
                      </label>
                    </fieldset>
                  )}

                  {getStatusBadge(version.status)}

                  {index === 0 && version.status === 'approved' && (
                    <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'>
                      当前版本
                    </span>
                  )}
                </div>

                <div className='mb-4 space-y-2'>
                  <div className='flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400'>
                    <div className='flex items-center gap-2'>
                      <UserCircleIcon className='size-4' strokeWidth={1.5} />
                      <span>编辑者: {version.users?.nickname || '未知用户'}</span>
                    </div>

                    <div className='flex items-center gap-2'>
                      <ClockIcon className='size-4' strokeWidth={1.5} />
                      <span>
                        {version.created_at ? formatArticleDate(version.created_at) : '未知时间'}
                      </span>
                    </div>
                  </div>

                  {version.commit_message && (
                    <div className='rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'>
                      <span className='font-medium'>提交说明: </span>
                      {version.commit_message}
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <div className='text-sm text-gray-700 dark:text-gray-300'>
                  <RichTextDisplay content={version.content} preview />
                </div>
              </div>

              {/* Actions */}
              <div className='ml-4 flex flex-col gap-2'>
                <ButtonLink
                  href={`/articles/${articleId}?version=${version.id}`}
                  variant='secondary'
                  size='sm'
                >
                  查看完整版本
                </ButtonLink>

                {canRevoke && version.status === 'approved' && index === 0 && (
                  <Button
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

                          success('版本已成功撤销，正在刷新...');
                          // Refresh the history data
                          setTimeout(() => {
                            window.location.reload();
                          }, 800);
                        } catch (err) {
                          console.error('Error revoking version:', err);
                          showError(
                            `撤销操作失败: ${err instanceof Error ? err.message : '未知错误'}`
                          );
                        }
                      }
                    }}
                    variant='danger'
                    size='sm'
                  >
                    撤销版本
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className='mt-8 text-center'>
        <div className='flex flex-wrap justify-center gap-3'>
          <ButtonLink href={`/articles/${articleId}`}>返回文章</ButtonLink>

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
