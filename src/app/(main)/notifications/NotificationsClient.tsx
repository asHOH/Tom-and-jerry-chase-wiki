'use client';

import { useState } from 'react';
import useSWRInfinite from 'swr/infinite';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { getNotificationKindMeta } from '@/lib/notifications/kinds';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingState from '@/components/ui/LoadingState';
import Notice from '@/components/ui/Notice';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import SectionHeader from '@/components/ui/SectionHeader';
import { ChatBubbleIcon, CheckCircleIcon, CloseIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  source_ids: string[];
  read_at: string | null;
  created_at: string;
};

type NotificationPage = {
  notifications: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
};

const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('请求失败');
  return (await response.json()) as T;
};

export default function NotificationsClient() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, error, size, setSize, mutate, isLoading } = useSWRInfinite<NotificationPage>(
    (pageIndex, previousPage) => {
      if (pageIndex > 0 && !previousPage?.nextCursor) return null;
      const params = new URLSearchParams({ filter });
      if (previousPage?.nextCursor) params.set('cursor', previousPage.nextCursor);
      return `/api/notifications?${params.toString()}`;
    },
    jsonFetcher
  );

  const notifications = data?.flatMap((page) => page.notifications) ?? [];
  const unreadCount = data?.[0]?.unreadCount ?? 0;
  const hasMore = !!data?.at(-1)?.nextCursor;

  const markRead = async (notificationId?: string) => {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationId ? { notificationId } : { markAll: true }),
    });
    if (response.ok) await mutate();
  };

  return (
    <PageShell width='standard' className='space-y-8 py-8 text-gray-900 dark:text-gray-100'>
      <PageHeader title='通知中心' description='查看和管理站内通知' />

      <Card as='section' className='border-border overflow-hidden border p-0'>
        <div className='border-border border-b px-4 py-4 sm:px-5'>
          <SectionHeader title='通知记录'>
            {unreadCount > 0 ? (
              <span className='rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'>
                {unreadCount} 条未读
              </span>
            ) : null}
          </SectionHeader>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='bg-surface-sunken inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-600'>
              {(['all', 'unread'] as const).map((value) => (
                <Button
                  variant='unstyled'
                  key={value}
                  type='button'
                  aria-pressed={filter === value}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    filter === value
                      ? 'bg-surface text-blue-700 shadow-sm dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  )}
                  onClick={() => setFilter(value)}
                >
                  {value === 'all' ? '全部' : '未读'}
                </Button>
              ))}
            </div>
            {unreadCount > 0 ? (
              <Button size='sm' variant='ghost' onClick={() => void markRead()}>
                全部标为已读
              </Button>
            ) : null}
          </div>
        </div>

        <div className='p-3 sm:p-4'>
          {isLoading ? <LoadingState message='正在加载通知…' /> : null}
          {error ? <Notice variant='error'>通知加载失败，请稍后重试。</Notice> : null}
          {!isLoading && !error && notifications.length === 0 ? (
            <Card bordered className='bg-background/60 border-dashed px-5 py-12 text-center'>
              <div className='bg-surface-muted mx-auto mb-3 flex size-11 items-center justify-center rounded-full text-gray-500 dark:text-gray-300'>
                <CheckCircleIcon className='size-6' />
              </div>
              <p className='font-medium text-gray-700 dark:text-gray-200'>
                暂无{filter === 'unread' ? '未读' : ''}通知
              </p>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>站内通知会显示在这里</p>
            </Card>
          ) : null}

          <div className='space-y-2'>
            {notifications.map((notification) => {
              const kindMeta = getNotificationKindMeta(notification.kind);
              const content = (
                <Card
                  as='article'
                  bordered
                  className={cn(
                    'group flex gap-3 px-3.5 py-3.5 transition-all sm:gap-4 sm:px-4',
                    notification.read_at
                      ? 'hover:bg-control/70 hover:border-gray-300 dark:hover:border-gray-600'
                      : 'border-blue-200 bg-blue-50/80 shadow-sm hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/50'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                      kindMeta.tone === 'success'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : kindMeta.tone === 'danger'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : kindMeta.tone === 'warning'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    )}
                  >
                    {kindMeta.tone === 'success' ? (
                      <CheckCircleIcon className='size-5' />
                    ) : kindMeta.tone === 'danger' ? (
                      <CloseIcon className='size-5' />
                    ) : (
                      <ChatBubbleIcon className='size-5' />
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-3'>
                      <h3 className='font-semibold text-gray-900 dark:text-gray-100'>
                        {notification.title}
                      </h3>
                      {!notification.read_at ? (
                        <span className='mt-1.5 size-2 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/50' />
                      ) : null}
                    </div>
                    <p className='mt-1.5 text-sm leading-6 whitespace-pre-wrap text-gray-600 dark:text-gray-300'>
                      {notification.body}
                    </p>
                    <div className='mt-2 flex items-center justify-between gap-3'>
                      <time className='text-xs text-gray-500 dark:text-gray-400'>
                        {formatCompactDateTime(notification.created_at)}
                      </time>
                      {notification.href ? (
                        <span className='text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400'>
                          查看详情 →
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );

              return notification.href ? (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className='block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
                  onClick={() => void markRead(notification.id)}
                >
                  {content}
                </Link>
              ) : (
                <Button
                  variant='unstyled'
                  key={notification.id}
                  type='button'
                  className='block w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
                  onClick={() => void markRead(notification.id)}
                >
                  {content}
                </Button>
              );
            })}
          </div>

          {hasMore ? (
            <div className='pt-4 text-center'>
              <Button variant='secondary' onClick={() => void setSize(size + 1)}>
                加载更多
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    </PageShell>
  );
}
