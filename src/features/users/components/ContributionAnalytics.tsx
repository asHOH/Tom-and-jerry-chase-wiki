import { cn } from '@/lib/design';
import type {
  ContributionBreakdownItem,
  ContributionMetrics,
  ContributionMonthlyBucket,
} from '@/lib/users/contributionActivity';
import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

import {
  contributionNumberFormatter,
  formatContributionAverage,
  formatContributionCount,
  formatContributionDate,
  formatContributionMonth,
} from './utils';

type ContributionMonthInput =
  | ContributionMonthlyBucket
  | {
      key: string;
      label: string;
      count: number;
    };

type ContributionCategoryInput =
  | ContributionBreakdownItem
  | {
      key: string;
      label: string;
      count: number;
    };

/** Props for the contribution metrics, trend, and category breakdown section. */
export type ContributionAnalyticsProps = {
  /** Aggregate contribution metrics. Pass null while the analytics loader has no result. */
  metrics: ContributionMetrics | null;
  /** Monthly totals used to render the dependency-free bar trend. */
  months: readonly ContributionMonthInput[];
  /** Type/category totals used to render the contribution breakdown. */
  categories: readonly ContributionCategoryInput[];
  /** Renders the analytics loading state when the supplemental analytics loader is pending. */
  isLoading?: boolean;
  /** Marks calendar-derived metrics and monthly data as unavailable. */
  hasMetricsError?: boolean;
  /** Marks the independently loaded category breakdown as unavailable. */
  hasBreakdownError?: boolean;
  /** Optional wrapper class name for route-level spacing or width adjustments. */
  className?: string;
};

const CATEGORY_BAR_CLASSES = [
  'bg-blue-600 dark:bg-blue-400',
  'bg-indigo-500 dark:bg-indigo-400',
  'bg-sky-500 dark:bg-sky-400',
  'bg-violet-500 dark:bg-violet-400',
] as const;

type MetricCard = {
  label: string;
  value: string;
  detail?: string;
};

function getMetricCards(metrics: ContributionMetrics): MetricCard[] {
  return [
    {
      label: '总贡献',
      value: formatContributionCount(metrics.total),
      detail: '公开贡献记录',
    },
    {
      label: '活跃天数',
      value: formatContributionCount(metrics.activeDays),
      detail: '有贡献的日期',
    },
    {
      label: '当前连续',
      value: `${formatContributionCount(metrics.currentStreak)} 天`,
      detail: '当前连续贡献',
    },
    {
      label: '最长连续',
      value: `${formatContributionCount(metrics.longestStreak)} 天`,
      detail: '历史最长连续',
    },
    {
      label: '活跃日均',
      value: formatContributionAverage(metrics.averagePerActiveDay),
      detail: '每个活跃日的贡献',
    },
    {
      label: '最忙的一天',
      value: metrics.busiestDay ? formatContributionCount(metrics.busiestDay.count) : '暂无',
      detail: metrics.busiestDay ? formatContributionDate(metrics.busiestDay.date) : '还没有贡献',
    },
  ];
}

function AnalyticsSkeleton() {
  return (
    <div className='space-y-4' aria-busy='true' aria-label='正在加载贡献分析'>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} bordered className='space-y-3 p-3'>
            <Skeleton className='h-3 w-16' />
            <Skeleton className='h-7 w-20' />
            <Skeleton className='h-3 w-24' />
          </Card>
        ))}
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card bordered className='space-y-3'>
          <Skeleton className='h-5 w-28' />
          <Skeleton className='h-32 w-full' />
        </Card>
        <Card bordered className='space-y-3'>
          <Skeleton className='h-5 w-28' />
          <Skeleton className='h-32 w-full' />
        </Card>
      </div>
    </div>
  );
}

function getMonthKey(month: ContributionMonthInput): string {
  return 'month' in month ? String(month.month) : month.key;
}

function getMonthLabel(month: ContributionMonthInput): string {
  if ('month' in month) return formatContributionMonth(`${String(month.month)}-01`);
  return month.label;
}

function MonthlyTrend({ months }: { months: readonly ContributionMonthInput[] }) {
  const visibleMonths = months.slice(-12);
  const maxCount = Math.max(0, ...visibleMonths.map((month) => Math.max(0, month.count)));

  return (
    <Card bordered as='section' aria-label='按月贡献趋势' className='space-y-4 p-4'>
      <div>
        <h3 className='font-semibold text-gray-900 dark:text-gray-100'>每月趋势</h3>
        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
          最近 {visibleMonths.length} 个月
        </p>
      </div>

      {visibleMonths.length === 0 ? (
        <p className='rounded-lg bg-gray-50 px-3 py-6 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400'>
          暂无月度数据
        </p>
      ) : (
        <ol
          className='flex min-h-40 items-end gap-2 overflow-x-auto pb-1'
          aria-label='月度贡献柱状图'
        >
          {visibleMonths.map((month) => {
            const count = Math.max(0, month.count);
            const height = maxCount > 0 ? Math.max(8, Math.round((count / maxCount) * 96)) : 8;

            return (
              <li
                key={getMonthKey(month)}
                className='flex min-w-12 flex-1 flex-col items-center justify-end gap-1 text-center'
                aria-label={`${getMonthLabel(month)}：${formatContributionCount(count)} 次贡献`}
              >
                <span className='text-xs font-medium text-gray-700 dark:text-gray-200'>
                  {formatContributionCount(count)}
                </span>
                <span
                  aria-hidden='true'
                  className='w-5 rounded-t-md bg-blue-500 transition-[height] dark:bg-blue-400'
                  style={{ height: `${height}px` }}
                />
                <span className='max-w-16 truncate text-[11px] text-gray-500 dark:text-gray-400'>
                  {getMonthLabel(month) || getMonthKey(month)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function getCategoryKey(category: ContributionCategoryInput): string {
  return 'category' in category ? category.category : category.key;
}

function CategoryBreakdown({
  categories,
  hasError,
}: {
  categories: readonly ContributionCategoryInput[];
  hasError: boolean;
}) {
  const visibleCategories = categories.filter((category) => Number.isFinite(category.count));
  const total = visibleCategories.reduce((sum, category) => sum + Math.max(0, category.count), 0);

  return (
    <Card bordered as='section' aria-label='贡献类型分布' className='space-y-4 p-4'>
      <div>
        <h3 className='font-semibold text-gray-900 dark:text-gray-100'>类型分布</h3>
        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>按贡献类型统计</p>
      </div>

      {hasError ? (
        <div
          role='alert'
          className='rounded-lg border border-red-200 bg-red-50 px-3 py-5 text-center text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-200'
        >
          类型分布加载失败，请稍后重试。
        </div>
      ) : visibleCategories.length === 0 ? (
        <p className='rounded-lg bg-gray-50 px-3 py-6 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400'>
          暂无类型数据
        </p>
      ) : (
        <ul className='space-y-4'>
          {visibleCategories.map((category, index) => {
            const count = Math.max(0, category.count);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <li key={getCategoryKey(category)}>
                <div className='flex items-baseline justify-between gap-3 text-sm'>
                  <span className='min-w-0 truncate font-medium text-gray-700 dark:text-gray-200'>
                    {category.label || getCategoryKey(category)}
                  </span>
                  <span className='shrink-0 text-gray-500 dark:text-gray-400'>
                    {formatContributionCount(count)} 次 · {percentage}%
                  </span>
                </div>
                <div
                  className='mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800'
                  role='progressbar'
                  aria-label={`${category.label || getCategoryKey(category)}占比`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentage}
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width]',
                      CATEGORY_BAR_CLASSES[index % CATEGORY_BAR_CLASSES.length]
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {total > 0 && (
        <p className='border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400'>
          类型合计 {contributionNumberFormatter.format(total)} 次
        </p>
      )}
    </Card>
  );
}

/**
 * Displays six high-value contribution metrics, a compact CSS-only monthly trend, and a
 * percentage breakdown by category. Loading and error presentation are entirely controlled by
 * the boolean props so independent server loaders can fail without taking down the profile page.
 */
export function ContributionAnalytics({
  metrics,
  months,
  categories,
  isLoading = false,
  hasMetricsError = false,
  hasBreakdownError = false,
  className,
}: ContributionAnalyticsProps) {
  return (
    <Card
      as='section'
      bordered
      aria-label='贡献分析'
      className={cn('space-y-5 p-4 sm:p-5', className)}
    >
      <header>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>贡献分析</h2>
        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
          用连续性、活跃度和类型分布了解贡献节奏
        </p>
      </header>

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {hasMetricsError ? (
            <div
              role='alert'
              className='rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-200'
            >
              <p className='font-medium'>贡献指标加载失败</p>
              <p className='mt-1 text-red-700/80 dark:text-red-300/80'>请稍后刷新页面重试。</p>
            </div>
          ) : metrics ? (
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {getMetricCards(metrics).map((metric) => (
                <Card
                  key={metric.label}
                  bordered
                  className='space-y-1.5 border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/30'
                >
                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                    {metric.label}
                  </p>
                  <p className='text-xl font-bold tracking-tight text-blue-700 dark:text-blue-300'>
                    {metric.value}
                  </p>
                  <p className='text-[11px] text-gray-500 dark:text-gray-400'>{metric.detail}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className='rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400'>
              暂无贡献指标数据
            </div>
          )}

          <div className='grid gap-4 md:grid-cols-2'>
            {hasMetricsError ? (
              <Card bordered as='section' aria-label='按月贡献趋势' className='space-y-3 p-4'>
                <h3 className='font-semibold text-gray-900 dark:text-gray-100'>每月趋势</h3>
                <p className='rounded-lg bg-gray-50 px-3 py-6 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400'>
                  月度趋势暂不可用
                </p>
              </Card>
            ) : (
              <MonthlyTrend months={months} />
            )}
            <CategoryBreakdown categories={categories} hasError={hasBreakdownError} />
          </div>
        </>
      )}
    </Card>
  );
}
