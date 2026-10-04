import type { Metadata, Route } from 'next';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import {
  getRecentChanges,
  normalizeRecentChangesFilter,
  normalizeRecentChangesPage,
  type RecentChange,
  type RecentChangesFilter,
} from '@/lib/recentChanges';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import Link from '@/components/Link';

const DESCRIPTION = '查看社区最近通过审核的文章与游戏数据更改';

export const metadata: Metadata = generatePageMetadata({
  title: '最近更改',
  description: DESCRIPTION,
  keywords: ['最近更改', '编辑记录', '社区贡献'],
  canonicalUrl: getCanonicalUrl('/recent-changes'),
});

type PageProps = {
  searchParams: Promise<{ type?: string; page?: string }>;
};

const FILTERS: { value: RecentChangesFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'articles', label: '文章' },
  { value: 'game-data', label: '游戏数据' },
];

function recentChangesHref(filter: RecentChangesFilter, page = 1): Route {
  const params = new URLSearchParams();
  if (filter !== 'all') params.set('type', filter);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `/recent-changes?${query}` : '/recent-changes') as Route;
}

export default async function RecentChangesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filter = normalizeRecentChangesFilter(resolvedSearchParams.type);
  const requestedPage = normalizeRecentChangesPage(resolvedSearchParams.page);
  const result = await getRecentChanges(filter, requestedPage);

  return (
    <PageShell width='standard' className='space-y-6 py-6 sm:py-8 dark:text-gray-100'>
      <PageHeader title='最近更改' description={DESCRIPTION} />

      <nav aria-label='更改类型筛选' className='flex justify-center gap-2'>
        {FILTERS.map((option) => {
          const active = option.value === filter;
          return (
            <Link
              key={option.value}
              href={recentChangesHref(option.value)}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white'
                  : 'bg-control hover:bg-control-hover rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors dark:text-gray-200'
              }
            >
              {option.label}
            </Link>
          );
        })}
      </nav>

      <Card as='section' className='border-border overflow-hidden border p-0'>
        <div className='border-border flex items-center justify-between border-b px-4 py-3 text-sm text-gray-500 sm:px-5 dark:text-gray-400'>
          <span>共 {result.totalItems} 条公开更改</span>
          {result.totalItems > 0 && (
            <span>
              第 {result.currentPage} / {result.totalPages} 页
            </span>
          )}
        </div>

        {result.changes.length > 0 ? (
          <ol className='divide-y divide-gray-100 dark:divide-gray-700'>
            {result.changes.map((change) => (
              <li key={`${change.kind}-${change.id}`} className='px-4 py-4 sm:px-5'>
                <ChangeContent change={change} />
              </li>
            ))}
          </ol>
        ) : (
          <p className='px-5 py-14 text-center text-gray-500 dark:text-gray-400'>暂无公开更改</p>
        )}
      </Card>

      <Pagination filter={filter} currentPage={result.currentPage} totalPages={result.totalPages} />
    </PageShell>
  );
}

function ChangeContent({ change }: { change: RecentChange }) {
  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-5'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          {change.href ? (
            <Link
              href={change.href}
              className='font-medium text-blue-700 hover:underline dark:text-blue-300'
            >
              {change.title}
            </Link>
          ) : (
            <span className='font-medium'>{change.title}</span>
          )}
          <span className='bg-surface-muted rounded px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-300'>
            {change.kind === 'article' ? '文章' : '游戏数据'}
          </span>
        </div>
        {change.description && (
          <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>{change.description}</p>
        )}
        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
          {change.editor ? (
            <>
              由{' '}
              <Link
                href={`/users/${encodeURIComponent(change.editor.nickname)}` as Route}
                className='hover:text-blue-600 hover:underline dark:hover:text-blue-300'
              >
                {change.editor.nickname}
              </Link>{' '}
              提交
            </>
          ) : (
            '匿名或已删除用户提交'
          )}
        </p>
      </div>
      <time
        dateTime={change.createdAt}
        className='shrink-0 text-xs text-gray-500 sm:pt-1 dark:text-gray-400'
      >
        {formatCompactDateTime(change.createdAt, { relativeRecent: true })}
      </time>
    </div>
  );
}

function Pagination({
  filter,
  currentPage,
  totalPages,
}: {
  filter: RecentChangesFilter;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label='最近更改分页' className='flex items-center justify-center gap-3'>
      {currentPage > 1 ? (
        <Link
          href={recentChangesHref(filter, currentPage - 1)}
          className='bg-control hover:bg-control-hover rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
        >
          上一页
        </Link>
      ) : (
        <span className='bg-control cursor-not-allowed rounded-lg px-4 py-2 text-sm text-gray-400 opacity-60'>
          上一页
        </span>
      )}
      <span className='text-sm text-gray-600 dark:text-gray-300'>
        第 {currentPage} 页，共 {totalPages} 页
      </span>
      {currentPage < totalPages ? (
        <Link
          href={recentChangesHref(filter, currentPage + 1)}
          className='bg-control hover:bg-control-hover rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
        >
          下一页
        </Link>
      ) : (
        <span className='bg-control cursor-not-allowed rounded-lg px-4 py-2 text-sm text-gray-400 opacity-60'>
          下一页
        </span>
      )}
    </nav>
  );
}
