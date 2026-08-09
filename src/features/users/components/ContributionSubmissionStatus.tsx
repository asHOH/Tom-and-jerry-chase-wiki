'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import type {
  ContributionKind,
  ContributionStatus,
  ContributionStatusResponse,
} from '@/lib/users/contributionStatus';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import Card from '@/components/ui/Card';
import LoadingState from '@/components/ui/LoadingState';
import Notice from '@/components/ui/Notice';
import Link from '@/components/Link';

type FilterKind = 'all' | ContributionKind;
type FilterStatus = 'all' | ContributionStatus;

const STATUS_META: Record<
  ContributionStatus,
  { label: string; className: string; filterLabel: string }
> = {
  pending: {
    label: '待审核',
    filterLabel: '待审核',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-200',
  },
  approved: {
    label: '已通过',
    filterLabel: '已通过',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-200',
  },
  rejected: {
    label: '未通过',
    filterLabel: '未通过',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-200',
  },
  synced: {
    label: '已同步',
    filterLabel: '已同步',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/35 dark:text-purple-200',
  },
  revoked: {
    label: '已撤回',
    filterLabel: '已撤回',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  },
};

const jsonFetcher = async (url: string): Promise<ContributionStatusResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error('加载贡献记录失败') as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return (await response.json()) as ContributionStatusResponse;
};

export default function ContributionSubmissionStatus() {
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get('highlight');
  const [kindFilter, setKindFilter] = useState<FilterKind>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const { data, error, isLoading, mutate } = useSWR<ContributionStatusResponse>(
    '/api/contributions',
    jsonFetcher
  );

  const contributions = useMemo(() => data?.contributions ?? [], [data?.contributions]);
  const filteredContributions = useMemo(
    () =>
      contributions.filter(
        (contribution) =>
          (kindFilter === 'all' || contribution.kind === kindFilter) &&
          (statusFilter === 'all' || contribution.status === statusFilter)
      ),
    [contributions, kindFilter, statusFilter]
  );
  const summary = useMemo(
    () => ({
      total: contributions.length,
      pending: contributions.filter(({ status }) => status === 'pending').length,
      public: contributions.filter(({ isPublic }) => isPublic).length,
      rejected: contributions.filter(({ status }) => status === 'rejected').length,
    }),
    [contributions]
  );

  useEffect(() => {
    if (!highlightedId || !data) return;
    requestAnimationFrame(() => {
      document
        .getElementById(`contribution-${highlightedId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [data, highlightedId]);

  return (
    <section aria-labelledby='my-submissions-heading' className='space-y-6'>
      <header>
        <p className='text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase dark:text-blue-300'>
          私人记录
        </p>
        <h2 id='my-submissions-heading' className='mt-1 text-xl font-semibold'>
          我的提交
        </h2>
        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
          查看文章与游戏数据提交的审核状态和反馈
        </p>
      </header>

      {isLoading && <LoadingState message='正在加载贡献记录…' />}

      {error && (
        <Card className='py-10 text-center'>
          <h2 className='text-xl font-semibold'>
            {(error as Error & { status?: number }).status === 401
              ? '请先登录'
              : '贡献记录加载失败'}
          </h2>
          <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
            {(error as Error & { status?: number }).status === 401
              ? '登录后即可查看自己的提交状态与审核反馈。'
              : '请稍后重试。'}
          </p>
          <div className='mt-5'>
            <ButtonLink href='/'>返回首页</ButtonLink>
          </div>
        </Card>
      )}

      {!isLoading && !error && data && (
        <>
          <section aria-label='贡献统计' className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {[
              { label: '全部提交', value: summary.total },
              { label: '待审核', value: summary.pending },
              { label: '已公开', value: summary.public },
              { label: '未通过', value: summary.rejected },
            ].map(({ label, value }) => (
              <Card key={label} className='text-center'>
                <div className='text-2xl font-bold'>{value}</div>
                <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{label}</div>
              </Card>
            ))}
          </section>

          {data.truncated && (
            <Notice variant='info'>当前仅显示最近的文章和游戏数据贡献记录。</Notice>
          )}

          <Card as='section' className='space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex flex-wrap gap-2' aria-label='贡献类型筛选'>
                {(
                  [
                    ['all', '全部类型'],
                    ['article', '文章'],
                    ['gameData', '游戏数据'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    size='sm'
                    variant={kindFilter === value ? 'primary' : 'secondary'}
                    aria-pressed={kindFilter === value}
                    onClick={() => setKindFilter(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className='flex flex-wrap gap-2' aria-label='审核状态筛选'>
                <Button
                  size='sm'
                  variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                  aria-pressed={statusFilter === 'all'}
                  onClick={() => setStatusFilter('all')}
                >
                  全部状态
                </Button>
                {(
                  Object.entries(STATUS_META) as Array<
                    [ContributionStatus, (typeof STATUS_META)[ContributionStatus]]
                  >
                ).map(([value, meta]) => (
                  <Button
                    key={value}
                    size='sm'
                    variant={statusFilter === value ? 'primary' : 'secondary'}
                    aria-pressed={statusFilter === value}
                    onClick={() => setStatusFilter(value)}
                  >
                    {meta.filterLabel}
                  </Button>
                ))}
                <Button size='sm' variant='ghost' onClick={() => void mutate()}>
                  刷新
                </Button>
              </div>
            </div>

            <p className='text-sm text-gray-500 dark:text-gray-400'>
              显示 {filteredContributions.length} / {contributions.length} 条记录
            </p>
          </Card>

          {filteredContributions.length === 0 ? (
            <Card className='py-12 text-center'>
              <h2 className='text-xl font-semibold'>暂无符合条件的贡献</h2>
              <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                {contributions.length === 0
                  ? '从修正一个数值或补充一句说明开始吧。'
                  : '可以切换类型或审核状态筛选。'}
              </p>
              {contributions.length === 0 && (
                <div className='mt-5'>
                  <ButtonLink href='/usages/edit'>查看编辑指南</ButtonLink>
                </div>
              )}
            </Card>
          ) : (
            <ol className='space-y-3'>
              {filteredContributions.map((contribution) => {
                const statusMeta = STATUS_META[contribution.status];
                return (
                  <li key={`${contribution.kind}-${contribution.id}`}>
                    <Card
                      as='article'
                      id={`contribution-${contribution.id}`}
                      className={cn(
                        'scroll-mt-24',
                        highlightedId === contribution.id &&
                          'border-blue-400 ring-2 ring-blue-200 dark:border-blue-500 dark:ring-blue-900'
                      )}
                    >
                      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                              {contribution.kind === 'article' ? '文章' : '游戏数据'}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-1 text-xs font-medium',
                                statusMeta.className
                              )}
                            >
                              {statusMeta.label}
                            </span>
                            {contribution.status === 'pending' && contribution.isPublic && (
                              <span className='rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200'>
                                审核中但已公开
                              </span>
                            )}
                            {contribution.thanked && (
                              <span className='rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-800 dark:bg-pink-900/35 dark:text-pink-200'>
                                已获感谢
                              </span>
                            )}
                          </div>

                          <h3 className='mt-2 text-lg font-semibold'>{contribution.title}</h3>
                          {contribution.description && (
                            <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>
                              {contribution.description}
                            </p>
                          )}

                          <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400'>
                            <time dateTime={contribution.createdAt}>
                              提交于 {formatCompactDateTime(contribution.createdAt)}
                            </time>
                            {contribution.reviewedAt && (
                              <time dateTime={contribution.reviewedAt}>
                                审核于 {formatCompactDateTime(contribution.reviewedAt)}
                              </time>
                            )}
                          </div>

                          {contribution.feedback && (
                            <Notice
                              variant={contribution.status === 'rejected' ? 'error' : 'info'}
                              className='mt-4'
                            >
                              <span className='font-semibold'>审核反馈: </span>
                              {contribution.feedback}
                            </Notice>
                          )}
                          {contribution.thankMessage && (
                            <Notice variant='success' className='mt-4 whitespace-pre-wrap'>
                              {contribution.thankMessage}
                            </Notice>
                          )}
                        </div>

                        <div className='flex shrink-0 flex-wrap gap-2 sm:w-40 sm:flex-col'>
                          {contribution.href && (
                            <ButtonLink
                              href={contribution.href as Route}
                              size='sm'
                              variant='secondary'
                            >
                              查看公开内容
                            </ButtonLink>
                          )}
                          {contribution.previewHref && (
                            <ButtonLink
                              href={contribution.previewHref as Route}
                              size='sm'
                              variant='secondary'
                            >
                              预览提交
                            </ButtonLink>
                          )}
                          {contribution.reviseHref && (
                            <ButtonLink href={contribution.reviseHref as Route} size='sm'>
                              {contribution.status === 'rejected' ? '修改后重提' : '继续编辑'}
                            </ButtonLink>
                          )}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ol>
          )}

          <div className='text-center text-sm text-gray-500 dark:text-gray-400'>
            审核结果也会发送到
            <Link
              href='/notifications/'
              className='mx-1 text-blue-600 hover:underline dark:text-blue-400'
            >
              通知中心
            </Link>
            。
          </div>
        </>
      )}
    </section>
  );
}
