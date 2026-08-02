import type { Route } from 'next';

import { cn } from '@/lib/design';
import type {
  ContributionActivityFilter,
  ContributionActivityItem,
  ContributionActivityPage,
} from '@/lib/users/contributionActivity';
import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from '@/components/Link';

import {
  contributionMonthKey,
  formatContributionCount,
  formatContributionMonth,
  formatContributionTimestamp,
} from './utils';

const ACTIVITY_PAGE_SIZE = 20;

const FILTER_OPTIONS: readonly [ContributionActivityFilter, string][] = [
  ['all', '全部'],
  ['articles', '文章'],
  ['game-data', '游戏数据'],
];

const ACTIVITY_KIND_META = {
  article: {
    label: '文章',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  },
  gameData: {
    label: '游戏数据',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  },
} as const;

/** Props for the filtered, month-grouped public activity history. */
export type ContributionActivityHistoryProps = {
  /** The current 20-entry activity page, or null while no successful page result exists. */
  page: ContributionActivityPage | null;
  /** The active filter represented by the current page URL. */
  filter: ContributionActivityFilter;
  /** Destination routes for the all, article, and game-data filter links. */
  filterHrefs: Readonly<Record<ContributionActivityFilter, Route>>;
  /** Builds a destination route for a numbered page while preserving the route's filter context. */
  pageHref: (page: number) => Route;
  /** Renders the history loading state while the independent activity loader is pending. */
  isLoading?: boolean;
  /** Renders the history error state when the independent activity loader failed. */
  hasError?: boolean;
  /** Optional wrapper class name for route-level spacing or width adjustments. */
  className?: string;
};

type ActivityGroup = {
  key: string;
  label: string;
  items: ContributionActivityItem[];
};

function getActivityGroupKey(createdAt: string): string {
  return contributionMonthKey(createdAt) ?? 'unknown';
}

function groupActivityItems(items: readonly ContributionActivityItem[]): ActivityGroup[] {
  const groups = new Map<string, ActivityGroup>();

  for (const item of items) {
    const key = getActivityGroupKey(item.createdAt);
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
      continue;
    }

    groups.set(key, {
      key,
      label: key === 'unknown' ? '时间未知' : formatContributionMonth(item.createdAt),
      items: [item],
    });
  }

  return [...groups.values()];
}

function ActivityFilters({
  filter,
  filterHrefs,
}: Pick<ContributionActivityHistoryProps, 'filter' | 'filterHrefs'>) {
  return (
    <nav aria-label='贡献类型筛选' className='flex flex-wrap gap-2'>
      {FILTER_OPTIONS.map(([value, label]) => {
        const isActive = value === filter;

        return (
          <Link
            key={value}
            href={filterHrefs[value]}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900',
              isActive
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm dark:border-blue-400 dark:bg-blue-500'
                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:text-blue-300'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActivityItemRow({ item }: { item: ContributionActivityItem }) {
  const kindMeta = ACTIVITY_KIND_META[item.kind];
  const title = item.title.trim() || '未命名活动';

  return (
    <Card
      as='article'
      bordered
      className='relative overflow-hidden p-4 transition-shadow hover:shadow-sm'
    >
      <div className='flex gap-3'>
        <span
          aria-hidden='true'
          className={cn(
            'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-blue-50 dark:ring-blue-950/40',
            item.kind === 'article' ? 'bg-blue-500' : 'bg-indigo-500'
          )}
        />
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span
              className={cn('rounded-full px-2 py-0.5 text-xs font-medium', kindMeta.className)}
            >
              {kindMeta.label}
            </span>
            <time dateTime={item.createdAt} className='text-xs text-gray-500 dark:text-gray-400'>
              {formatContributionTimestamp(item.createdAt)}
            </time>
          </div>

          <h4 className='mt-2 text-base font-semibold wrap-break-word text-gray-900 dark:text-gray-100'>
            {item.href ? (
              <Link
                href={item.href}
                className='rounded-sm text-blue-700 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-blue-300 dark:decoration-blue-700 dark:hover:text-blue-200'
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </h4>

          {item.description && (
            <p className='mt-2 text-sm leading-6 wrap-break-word whitespace-pre-wrap text-gray-600 dark:text-gray-300'>
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

type PageToken = number | 'ellipsis-start' | 'ellipsis-end';

function getPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const tokens: PageToken[] = [];
  let previousPage = 0;

  for (const page of sortedPages) {
    if (previousPage > 0 && page - previousPage > 1) {
      tokens.push(previousPage === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    tokens.push(page);
    previousPage = page;
  }

  return tokens;
}

function PageLink({
  page,
  currentPage,
  pageHref,
}: {
  page: number;
  currentPage: number;
  pageHref: (page: number) => Route;
}) {
  const isCurrent = page === currentPage;
  const classes =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900';

  return isCurrent ? (
    <span
      aria-current='page'
      className={cn(
        classes,
        'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500'
      )}
    >
      {page}
    </span>
  ) : (
    <Link
      href={pageHref(page)}
      aria-label={`第 ${page} 页`}
      className={cn(
        classes,
        'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:text-blue-300'
      )}
    >
      {page}
    </Link>
  );
}

function ActivityPagination({
  page,
  pageHref,
}: {
  page: ContributionActivityPage;
  pageHref: (page: number) => Route;
}) {
  const totalItems = Math.max(0, page.totalItems);
  const totalPages = Math.max(1, page.totalPages, Math.ceil(totalItems / ACTIVITY_PAGE_SIZE));
  const currentPage = Math.min(totalPages, Math.max(1, page.currentPage));

  if (totalItems === 0 || totalPages <= 1) return null;

  const tokens = getPageTokens(currentPage, totalPages);
  const mutedButtonClasses =
    'inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:text-blue-300 dark:focus:ring-offset-gray-900';

  return (
    <nav aria-label='贡献记录分页' className='border-t border-gray-200 pt-4 dark:border-gray-800'>
      <div className='flex flex-col items-center gap-3 sm:flex-row sm:justify-between'>
        <p className='text-xs text-gray-500 dark:text-gray-400'>
          共 {formatContributionCount(totalItems)} 条，每页 {ACTIVITY_PAGE_SIZE} 条 · 第{' '}
          {currentPage} / {totalPages} 页
        </p>
        <div className='flex flex-wrap items-center justify-center gap-1.5'>
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)} className={mutedButtonClasses}>
              上一页
            </Link>
          ) : (
            <span
              aria-disabled='true'
              className={cn(mutedButtonClasses, 'cursor-not-allowed opacity-50')}
            >
              上一页
            </span>
          )}

          {tokens.map((token) =>
            typeof token === 'number' ? (
              <PageLink key={token} page={token} currentPage={currentPage} pageHref={pageHref} />
            ) : (
              <span
                key={token}
                aria-hidden='true'
                className='px-1 text-gray-400 dark:text-gray-500'
              >
                …
              </span>
            )
          )}

          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)} className={mutedButtonClasses}>
              下一页
            </Link>
          ) : (
            <span
              aria-disabled='true'
              className={cn(mutedButtonClasses, 'cursor-not-allowed opacity-50')}
            >
              下一页
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

function ActivityLoadingState() {
  return (
    <div className='space-y-3' aria-busy='true' aria-label='正在加载贡献记录'>
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} bordered className='space-y-3 p-4'>
          <div className='flex gap-3'>
            <Skeleton className='mt-1 h-3 w-3 shrink-0 rounded-full' />
            <div className='min-w-0 flex-1 space-y-3'>
              <div className='flex gap-2'>
                <Skeleton className='h-5 w-14 rounded-full' />
                <Skeleton className='h-4 w-24' />
              </div>
              <Skeleton className='h-5 w-3/4' />
              <Skeleton className='h-4 w-full' />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Renders public activity as filter links and URL-based pagination. Items are capped at 20 per
 * supplied page, grouped by Chinese calendar month, and presented with type badges, descriptions,
 * localized timestamps, and optional destination links. The server controls loading and error
 * presentation through booleans instead of the component catching loader failures itself.
 */
export function ContributionActivityHistory({
  page,
  filter,
  filterHrefs,
  pageHref,
  isLoading = false,
  hasError = false,
  className,
}: ContributionActivityHistoryProps) {
  const displayItems = page?.items.slice(0, ACTIVITY_PAGE_SIZE) ?? [];
  const groups = groupActivityItems(displayItems);

  return (
    <Card
      as='section'
      bordered
      aria-label='贡献历史'
      className={cn('space-y-5 p-4 sm:p-5', className)}
    >
      <header className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>贡献历史</h2>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            按时间查看文章与游戏数据贡献
          </p>
        </div>
        <ActivityFilters filter={filter} filterHrefs={filterHrefs} />
      </header>

      {hasError ? (
        <div
          role='alert'
          className='rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-200'
        >
          <p className='font-medium'>贡献历史加载失败</p>
          <p className='mt-1 text-red-700/80 dark:text-red-300/80'>请稍后刷新页面重试。</p>
        </div>
      ) : isLoading ? (
        <ActivityLoadingState />
      ) : page && displayItems.length > 0 ? (
        <>
          <div className='space-y-6'>
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`activity-month-${group.key}`}>
                <h3
                  id={`activity-month-${group.key}`}
                  className='mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200'
                >
                  <span className='h-1.5 w-1.5 rounded-full bg-blue-500' aria-hidden='true' />
                  {group.label}
                  <span className='font-normal text-gray-400 dark:text-gray-500'>
                    {group.items.length} 条
                  </span>
                </h3>
                <div className='space-y-3'>
                  {group.items.map((item) => (
                    <ActivityItemRow key={`${item.kind}-${item.id}`} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
          <ActivityPagination page={page} pageHref={pageHref} />
        </>
      ) : (
        <div className='rounded-lg bg-gray-50 px-4 py-10 text-center dark:bg-gray-900/40'>
          <p className='font-medium text-gray-700 dark:text-gray-200'>暂无贡献记录</p>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            当前筛选条件下还没有公开活动。
          </p>
        </div>
      )}
    </Card>
  );
}
