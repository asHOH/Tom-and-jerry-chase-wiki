'use client';

import type { KeyboardEvent } from 'react';

import { cn } from '@/lib/design';
import type { ContributionCalendarDay } from '@/lib/users/contributionActivity';
import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import Tooltip from '@/components/ui/Tooltip';

import {
  buildContributionCalendarWeeks,
  contributionDateKey,
  formatContributionCount,
  formatContributionDate,
  getContributionCalendarRange,
  normalizeContributionDateKey,
} from './utils';

type ContributionCalendarDayInput = Pick<ContributionCalendarDay, 'date'> & {
  /** Requested contract field names. */
  articles?: number;
  gameData?: number;
  total?: number;
  /** Current server-loader field names retained for compatibility. */
  articleCount?: number;
  gameDataCount?: number;
  count?: number;
};

/** Props for the trailing-365-day contribution calendar. */
export type ContributionCalendarProps = {
  /** The daily contribution rows. Missing dates are rendered as zero-contribution days. */
  days: readonly ContributionCalendarDayInput[];
  /** Optional snapshot date in YYYY-MM-DD form. It is capped at today to avoid future cells. */
  asOf?: string;
  /** Renders the calendar's loading state when the supplemental calendar loader is pending. */
  isLoading?: boolean;
  /** Renders the calendar's error state when the supplemental calendar loader failed. */
  hasError?: boolean;
  /** Optional wrapper class name for route-level spacing or width adjustments. */
  className?: string;
};

const LEVEL_CLASSES = [
  'bg-slate-100 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700',
  'bg-blue-100 ring-blue-200 dark:bg-blue-950/80 dark:ring-blue-900',
  'bg-blue-300 ring-blue-300 dark:bg-blue-800 dark:ring-blue-700',
  'bg-blue-500 ring-blue-400 dark:bg-blue-500 dark:ring-blue-400',
  'bg-blue-800 ring-blue-700 dark:bg-blue-300 dark:ring-blue-200',
] as const;

const LEGEND_LABELS = ['0', '1', '2', '3', '4+'] as const;
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

function getContributionLevel(total: number): number {
  if (total <= 0) return 0;
  return Math.min(4, Math.round(total));
}

function getDayTotal(day: ContributionCalendarDayInput | undefined): number {
  const value = day?.total ?? day?.count ?? 0;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getDayArticleCount(day: ContributionCalendarDayInput | undefined): number {
  const value = day?.articles ?? day?.articleCount ?? 0;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getDayGameDataCount(day: ContributionCalendarDayInput | undefined): number {
  const value = day?.gameData ?? day?.gameDataCount ?? 0;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getDayLabel(date: string, day: ContributionCalendarDayInput | undefined): string {
  const total = getDayTotal(day);
  const articles = getDayArticleCount(day);
  const gameData = getDayGameDataCount(day);

  return `${formatContributionDate(date)}：${formatContributionCount(total)} 次贡献（文章 ${formatContributionCount(articles)} 次，游戏数据 ${formatContributionCount(gameData)} 次）`;
}

function DayTooltipContent({
  date,
  day,
}: {
  date: string;
  day: ContributionCalendarDayInput | undefined;
}) {
  const total = getDayTotal(day);
  const articles = getDayArticleCount(day);
  const gameData = getDayGameDataCount(day);

  return (
    <div className='space-y-0.5'>
      <div className='font-medium'>{formatContributionDate(date)}</div>
      <div>{formatContributionCount(total)} 次贡献</div>
      <div className='text-white/75'>
        文章 {formatContributionCount(articles)} 次 · 游戏数据 {formatContributionCount(gameData)}{' '}
        次
      </div>
    </div>
  );
}

function CalendarCell({
  date,
  day,
  cellIndex,
  dayOfWeek,
}: {
  date: string;
  day: ContributionCalendarDayInput | undefined;
  cellIndex: number;
  dayOfWeek: number;
}) {
  const total = getDayTotal(day);
  const label = getDayLabel(date, day);

  return (
    <Tooltip content={<DayTooltipContent date={date} day={day} />} asChild>
      <span
        role='gridcell'
        aria-label={label}
        tabIndex={cellIndex === 0 ? 0 : -1}
        data-contribution-calendar-cell
        onKeyDown={(event) => moveCalendarFocus(event, cellIndex, dayOfWeek)}
        className={cn(
          'h-4 w-4 shrink-0 rounded-[3px] ring-1 transition-transform ring-inset hover:scale-125 focus:z-10 focus:scale-125 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:focus:ring-blue-300',
          LEVEL_CLASSES[getContributionLevel(total)]
        )}
      />
    </Tooltip>
  );
}

function moveCalendarFocus(
  event: KeyboardEvent<HTMLSpanElement>,
  cellIndex: number,
  dayOfWeek: number
): void {
  const movement: Record<string, number | null> = {
    ArrowDown: dayOfWeek < 6 ? 1 : null,
    ArrowLeft: -7,
    ArrowRight: 7,
    ArrowUp: dayOfWeek > 0 ? -1 : null,
  };
  const offset = movement[event.key];
  const grid = event.currentTarget.closest('[role="grid"]');
  if (!grid) return;

  const cells = [...grid.querySelectorAll<HTMLElement>('[data-contribution-calendar-cell]')];
  const targetIndex =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? cells.length - 1
        : offset === undefined || offset === null
          ? null
          : cellIndex + offset;
  if (targetIndex === null || targetIndex < 0 || targetIndex >= cells.length) return;

  const target = cells[targetIndex];
  if (!target) return;

  event.preventDefault();
  event.currentTarget.tabIndex = -1;
  target.tabIndex = 0;
  target.focus();
}

function CalendarSkeleton() {
  return (
    <div className='space-y-3' aria-busy='true' aria-label='正在加载贡献日历'>
      <Skeleton className='h-4 w-32' />
      <Skeleton className='h-32 w-full' />
      <div className='flex justify-end'>
        <Skeleton className='h-4 w-40' />
      </div>
    </div>
  );
}

function CalendarLegend() {
  return (
    <div className='flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400'>
      <span>贡献次数</span>
      <div className='flex items-center gap-1' aria-label='贡献强度图例'>
        {LEGEND_LABELS.map((label, index) => (
          <span key={label} className='inline-flex items-center gap-1'>
            <span
              aria-hidden='true'
              className={cn('h-3 w-3 rounded-[2px] ring-1 ring-inset', LEVEL_CLASSES[index])}
            />
            <span className='sr-only'>{index === 4 ? '4 次及以上' : `${label} 次`}</span>
          </span>
        ))}
      </div>
      <span aria-hidden='true' className='flex gap-1'>
        {LEGEND_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </span>
    </div>
  );
}

/**
 * Displays a Sunday-aligned, horizontally scrollable contribution calendar for the latest 365
 * non-future days. A roving grid focus keeps the calendar to one tab stop while arrow keys expose
 * every Radix-backed tooltip; each label includes the date, total, article count, and game-data
 * count.
 */
export function ContributionCalendar({
  days,
  asOf,
  isLoading = false,
  hasError = false,
  className,
}: ContributionCalendarProps) {
  const range = getContributionCalendarRange(asOf);
  const weeks = buildContributionCalendarWeeks(asOf);
  const daysByDate = new Map<string, ContributionCalendarDayInput>();
  const cellIndexes = new Map<string, number>();

  for (const day of days) {
    const dateKey = normalizeContributionDateKey(day.date);
    if (!dateKey) continue;
    if (dateKey < formatDateKey(range.startDate) || dateKey > formatDateKey(range.endDate))
      continue;
    daysByDate.set(dateKey, day);
  }
  for (const week of weeks) {
    for (const cell of week) {
      if (cell.isVisible && cell.date) cellIndexes.set(cell.date, cellIndexes.size);
    }
  }

  return (
    <Card
      as='section'
      bordered
      aria-label='贡献日历'
      className={cn('space-y-5 overflow-hidden p-4 sm:p-6', className)}
    >
      <header className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase dark:text-blue-300'>
            活动概览
          </p>
          <h2 className='mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100'>贡献日历</h2>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            最近 365 天 · {formatDateKey(range.startDate)} 至 {formatDateKey(range.endDate)}
          </p>
        </div>
        <span className='bg-surface-muted hidden rounded-full px-2.5 py-1 text-xs font-medium text-gray-500 sm:inline-flex dark:text-gray-400'>
          按周查看
        </span>
      </header>

      {hasError ? (
        <div
          role='alert'
          className='rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-200'
        >
          <p className='font-medium'>贡献日历加载失败</p>
          <p className='mt-1 text-red-700/80 dark:text-red-300/80'>请稍后刷新页面重试。</p>
        </div>
      ) : isLoading ? (
        <CalendarSkeleton />
      ) : (
        <>
          <div className='overflow-x-auto overscroll-x-contain pb-1'>
            <div className='min-w-max px-1'>
              <div className='flex min-h-5 items-end'>
                <span className='w-7 shrink-0' aria-hidden='true' />
                <div className='flex gap-1'>
                  {weeks.map((week, weekIndex) => {
                    const monthCell = week.find((cell) => cell.date?.endsWith('-01'));
                    return (
                      <div key={weekIndex} className='w-4 shrink-0 overflow-visible'>
                        {monthCell?.date ? (
                          <span className='block text-[11px] leading-5 whitespace-nowrap text-gray-500 dark:text-gray-400'>
                            {formatMonthLabel(monthCell.date)}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className='mt-1 flex'>
                <div
                  className='grid w-7 shrink-0 grid-rows-7 gap-1 text-[10px] leading-4 text-gray-400 dark:text-gray-500'
                  aria-hidden='true'
                >
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label} className='h-4 text-center'>
                      {label}
                    </span>
                  ))}
                </div>
                <div role='grid' aria-label='最近 365 天每日贡献' className='flex gap-1'>
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} role='row' className='grid w-4 shrink-0 grid-rows-7 gap-1'>
                      {week.map((cell, dayIndex) => {
                        if (!cell.isVisible || !cell.date) {
                          return (
                            <span
                              key={`${weekIndex}-${dayIndex}`}
                              role='gridcell'
                              aria-hidden='true'
                              className='h-4 w-4'
                            />
                          );
                        }

                        return (
                          <CalendarCell
                            key={cell.date}
                            date={cell.date}
                            day={daysByDate.get(cell.date)}
                            cellIndex={cellIndexes.get(cell.date) ?? -1}
                            dayOfWeek={dayIndex}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <CalendarLegend />
        </>
      )}
    </Card>
  );
}

function formatDateKey(date: Date): string {
  return contributionDateKey(date);
}

function formatMonthLabel(dateKey: string): string {
  const month = Number(dateKey.slice(5, 7));
  return Number.isInteger(month) ? `${month}月` : '';
}
