'use client';

import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/design';
import { getGameDate } from '@/lib/gameUtils';
import onThisDayEvents from '@/data/generated/historyOnThisDay.json';
import { formatHistoryEventDate, getOnThisDayEvents } from '@/features/shared/history/onThisDay';
import Button from '@/components/ui/Button';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';

export default function OnThisDayCard() {
  const [today, setToday] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState(false);

  // The homepage is statically generated, so resolve the current Asia/Shanghai
  // date after hydration instead of baking in the build date's entries.
  useEffect(() => {
    setToday(getGameDate());
  }, []);

  const entries = useMemo(
    () => (today ? getOnThisDayEvents(onThisDayEvents, today) : null),
    [today]
  );

  if (entries && entries.topTier.length === 0) return null;

  const visibleEntries = entries
    ? expanded
      ? [...entries.topTier, ...entries.others]
      : entries.topTier
    : null;
  const hiddenCount = entries ? entries.others.length : 0;

  return (
    <section
      aria-labelledby='on-this-day-heading'
      className='rounded-xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm sm:p-5 dark:border-sky-900/70 dark:bg-sky-950/30'
    >
      <div className='mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h2 id='on-this-day-heading' className='text-lg font-bold text-slate-900 dark:text-white'>
          历史上的今天
        </h2>
        {today && (
          <p className='text-xs font-medium text-sky-700 dark:text-sky-300'>
            {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
          </p>
        )}
      </div>
      {visibleEntries ? (
        <>
          <ul id='on-this-day-list' className='space-y-3'>
            {visibleEntries.map((entry) => (
              <li
                key={`${entry.year}-${entry.date}-${entry.description}`}
                className='border-t border-sky-200/70 pt-3 first:border-t-0 first:pt-0 dark:border-sky-900/50'
              >
                <p className='flex flex-wrap items-center gap-2 text-xs font-medium text-sky-700 dark:text-sky-300'>
                  <span>
                    {entry.year}年 · {formatHistoryEventDate(entry.date)}
                  </span>
                  {entry.milestone && (
                    <span className='rounded-full bg-sky-100 px-2 py-0.5 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200'>
                      {entry.milestone}
                    </span>
                  )}
                </p>
                <div className='mt-1 text-sm leading-relaxed whitespace-pre-wrap text-slate-800 sm:text-base dark:text-slate-200'>
                  {entry.description}
                </div>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <div className='mt-3'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-controls='on-this-day-list'
                className='focus-visible:ring-focus focus-visible:ring-offset-background inline-flex cursor-pointer items-center gap-1 rounded-sm text-sm font-medium text-sky-700 transition-colors hover:text-sky-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-sky-300 dark:hover:text-sky-200'
              >
                <span>{expanded ? '收起' : `展开其余 ${hiddenCount} 条`}</span>
                <ChevronDownIcon
                  className={cn(
                    'h-3.5 w-3.5 transition-transform motion-reduce:transition-none',
                    expanded && 'rotate-180'
                  )}
                />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div aria-hidden='true' className='min-h-12' />
      )}
    </section>
  );
}
