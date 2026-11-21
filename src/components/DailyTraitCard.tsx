'use client';

import { useEffect, useMemo, useState } from 'react';

import { getGameDate } from '@/lib/gameUtils';
import { useTraitsData } from '@/context/TraitsContext';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { pickDailyTrait } from '@/features/shared/traits/dailyTrait';
import { OneTraitText } from '@/features/shared/traits/OneTraitText';
import Link from '@/components/Link';

const toTraitText = (text: string | string[]): string =>
  Array.isArray(text) ? text.join('\n') : text;

export default function DailyTraitCard() {
  const traits = useTraitsData();
  const [today, setToday] = useState<Date | null>(null);

  // The homepage is statically generated, so resolve the current Asia/Shanghai
  // date after hydration instead of baking in the build date's selection.
  useEffect(() => {
    setToday(getGameDate());
  }, []);

  const dailyTrait = useMemo(() => (today ? pickDailyTrait(traits, today) : null), [traits, today]);

  return (
    <section
      aria-labelledby='daily-trait-heading'
      className='rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm sm:p-5 dark:border-amber-900/70 dark:bg-amber-950/30'
    >
      <div className='mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h2 id='daily-trait-heading' className='text-lg font-bold text-slate-900 dark:text-white'>
          每日特性
        </h2>
        {today && (
          <p className='text-xs font-medium text-amber-700 dark:text-amber-300'>
            {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
          </p>
        )}
      </div>
      {dailyTrait ? (
        <>
          <div className='text-sm leading-relaxed whitespace-pre-wrap text-slate-800 sm:text-base dark:text-slate-200'>
            <TextWithHoverTooltips text={toTraitText(OneTraitText(dailyTrait.trait))} />
          </div>
          <div className='mt-3'>
            <Link
              href='/mechanics/traitCollection'
              className='focus-visible:ring-focus focus-visible:ring-offset-background inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline-offset-4 transition-colors hover:text-blue-800 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-blue-300 dark:hover:text-blue-200'
            >
              查看全部特性
              <span aria-hidden='true'>→</span>
            </Link>
          </div>
        </>
      ) : (
        <div aria-hidden='true' className='min-h-12' />
      )}
    </section>
  );
}
