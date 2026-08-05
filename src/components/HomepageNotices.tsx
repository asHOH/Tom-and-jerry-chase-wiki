'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { sanitizeNoticeHTML } from '@/lib/notices/sanitize';
import type { PublicNotice } from '@/lib/notices/types';
import Button from '@/components/ui/Button';
import { renderRichTextContent } from '@/components/ui/RichTextContent';

const DISMISSED_NOTICE_KEY = 'homepage-dismissed-notices';

const fetcher = async (url: string): Promise<{ notices: PublicNotice[] }> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load notices');
  return response.json();
};

const dismissalId = (notice: PublicNotice) => `${notice.id}:${notice.startsAt}`;

const RichNoticeContent = ({ html }: { html: string }) => (
  <div className='prose prose-sm dark:prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-a:text-blue-700 dark:prose-a:text-blue-300 max-w-none'>
    {renderRichTextContent(sanitizeNoticeHTML(html))}
  </div>
);

export default function HomepageNotices() {
  const { data } = useSWR<{ notices: PublicNotice[] }>('/api/notices', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hasLoadedDismissals, setHasLoadedDismissals] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(DISMISSED_NOTICE_KEY) ?? '[]') as unknown;
      if (Array.isArray(stored)) {
        setDismissed(new Set(stored.filter((value): value is string => typeof value === 'string')));
      }
    } catch (error) {
      console.warn('Failed to load dismissed homepage notices:', error);
    } finally {
      setHasLoadedDismissals(true);
    }
  }, []);

  const visibleNotices = useMemo(
    () => (data?.notices ?? []).filter((notice) => !dismissed.has(dismissalId(notice))),
    [data?.notices, dismissed]
  );

  if (!hasLoadedDismissals || visibleNotices.length === 0) return null;

  const [current, ...previous] = visibleNotices;
  if (!current) return null;

  const dismiss = (notice: PublicNotice) => {
    const next = new Set(dismissed).add(dismissalId(notice));
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_NOTICE_KEY, JSON.stringify([...next]));
    } catch (error) {
      console.warn('Failed to save dismissed homepage notices:', error);
    }
  };

  return (
    <section
      aria-label='站点公告'
      className='overflow-hidden rounded-xl border border-blue-200 bg-blue-50/80 shadow-sm dark:border-blue-900/70 dark:bg-blue-950/30'
    >
      <article className='p-4 sm:p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0'>
            <p className='mb-1 text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-300'>
              站点公告
            </p>
            <h2 className='text-lg font-bold text-slate-900 sm:text-xl dark:text-white'>
              {current.title}
            </h2>
          </div>
          <Button
            variant='unstyled'
            onClick={() => dismiss(current)}
            className='shrink-0 rounded-md px-2 py-1 text-sm text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-blue-200 dark:hover:bg-blue-900/50'
            aria-label={`关闭公告：${current.title}`}
          >
            关闭
          </Button>
        </div>
        <RichNoticeContent html={current.contentHtml} />
      </article>

      {previous.length > 0 && (
        <details className='group border-t border-blue-200 dark:border-blue-900/70'>
          <summary className='cursor-pointer px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100/70 focus:outline-none sm:px-5 dark:text-blue-200 dark:hover:bg-blue-900/30'>
            查看其他展示中的公告（{previous.length}）
          </summary>
          <div className='divide-y divide-blue-200 border-t border-blue-200 dark:divide-blue-900/70 dark:border-blue-900/70'>
            {previous.map((notice) => (
              <article
                key={dismissalId(notice)}
                className='bg-white/40 p-4 sm:p-5 dark:bg-slate-950/10'
              >
                <div className='flex items-start justify-between gap-4'>
                  <h3 className='font-semibold text-slate-900 dark:text-white'>{notice.title}</h3>
                  <Button
                    variant='unstyled'
                    onClick={() => dismiss(notice)}
                    className='shrink-0 rounded-md px-2 py-1 text-sm text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-blue-200 dark:hover:bg-blue-900/50'
                    aria-label={`关闭公告：${notice.title}`}
                  >
                    关闭
                  </Button>
                </div>
                <RichNoticeContent html={notice.contentHtml} />
              </article>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
