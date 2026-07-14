'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormControls';
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

type EmailSettings = {
  email: string | null;
  enabled: boolean;
  verifiedAt: string | null;
  pendingEmail: string | null;
  verificationExpiresAt: string | null;
};

const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('请求失败');
  return (await response.json()) as T;
};

export default function NotificationsClient() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [emailInput, setEmailInput] = useState('');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const { data, error, size, setSize, mutate, isLoading } = useSWRInfinite<NotificationPage>(
    (pageIndex, previousPage) => {
      if (pageIndex > 0 && !previousPage?.nextCursor) return null;
      const params = new URLSearchParams({ filter });
      if (previousPage?.nextCursor) params.set('cursor', previousPage.nextCursor);
      return `/api/notifications?${params.toString()}`;
    },
    jsonFetcher
  );
  const {
    data: emailSettings,
    mutate: mutateEmailSettings,
    error: emailSettingsError,
  } = useSWR<EmailSettings>('/api/notifications/email', jsonFetcher);

  const notifications = data?.flatMap((page) => page.notifications) ?? [];
  const unreadCount = data?.[0]?.unreadCount ?? 0;
  const hasMore = !!data?.at(-1)?.nextCursor;

  useEffect(() => {
    const emailStatus = searchParams.get('email');
    if (emailStatus === 'verified') setEmailMessage('通知邮箱验证成功。');
    if (emailStatus === 'invalid') setEmailMessage('验证链接无效或已过期。');
  }, [searchParams]);

  const refreshNotifications = async () => {
    await mutate();
  };

  const markRead = async (notificationId?: string) => {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationId ? { notificationId } : { markAll: true }),
    });
    if (response.ok) await refreshNotifications();
  };

  const requestVerification = async (event: FormEvent) => {
    event.preventDefault();
    setEmailBusy(true);
    setEmailMessage(null);
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      const responseBody = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(responseBody?.error || '验证邮件发送失败');
      setEmailMessage('验证邮件已发送，请在 30 分钟内完成验证。');
      setEmailInput('');
      await mutateEmailSettings();
    } catch (requestError) {
      setEmailMessage(requestError instanceof Error ? requestError.message : '验证邮件发送失败');
    } finally {
      setEmailBusy(false);
    }
  };

  const toggleEmail = async () => {
    if (!emailSettings?.verifiedAt) return;
    setEmailBusy(true);
    const response = await fetch('/api/notifications/email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !emailSettings.enabled }),
    });
    setEmailMessage(response.ok ? '邮件通知设置已更新。' : '邮件通知设置更新失败。');
    await mutateEmailSettings();
    setEmailBusy(false);
  };

  const removeEmail = async () => {
    if (!window.confirm('确认移除通知邮箱？')) return;
    setEmailBusy(true);
    const response = await fetch('/api/notifications/email', { method: 'DELETE' });
    setEmailMessage(response.ok ? '通知邮箱已移除。' : '通知邮箱移除失败。');
    await mutateEmailSettings();
    setEmailBusy(false);
  };

  return (
    <main className='mx-auto w-full max-w-3xl space-y-8 px-4 py-8'>
      <header className='space-y-2 text-center'>
        <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-100'>通知</h1>
        <p className='text-sm text-slate-600 dark:text-slate-400'>查看审核结果并管理通知邮箱</p>
      </header>

      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <h2 className='mb-3 text-lg font-semibold'>邮件通知</h2>
        {emailSettingsError ? (
          <p className='text-sm text-red-600 dark:text-red-400'>邮件设置加载失败。</p>
        ) : (
          <div className='space-y-3'>
            {emailSettings?.email ? (
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0 text-sm'>
                  <p className='truncate font-medium'>{emailSettings.email}</p>
                  <p className='text-slate-500 dark:text-slate-400'>
                    {emailSettings.enabled ? '审核邮件已启用' : '审核邮件已停用'}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button size='sm' variant='secondary' loading={emailBusy} onClick={toggleEmail}>
                    {emailSettings.enabled ? '停用' : '启用'}
                  </Button>
                  <Button size='sm' variant='danger' disabled={emailBusy} onClick={removeEmail}>
                    移除
                  </Button>
                </div>
              </div>
            ) : null}

            {emailSettings?.pendingEmail && (
              <p className='text-sm text-amber-700 dark:text-amber-300'>
                等待验证：{emailSettings.pendingEmail}
              </p>
            )}

            <form className='flex flex-col gap-2 sm:flex-row' onSubmit={requestVerification}>
              <FormInput
                type='email'
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder={emailSettings?.email ? '更换通知邮箱' : '添加通知邮箱'}
                required
              />
              <Button type='submit' loading={emailBusy} className='shrink-0'>
                发送验证邮件
              </Button>
            </form>
            {emailMessage && (
              <p className='text-sm text-slate-600 dark:text-slate-300'>{emailMessage}</p>
            )}
          </div>
        )}
      </section>

      <section className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              全部
            </Button>
            <Button
              size='sm'
              variant={filter === 'unread' ? 'primary' : 'secondary'}
              onClick={() => setFilter('unread')}
            >
              未读 {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button size='sm' variant='secondary' onClick={() => void markRead()}>
              全部标为已读
            </Button>
          )}
        </div>

        {isLoading && <p className='py-12 text-center text-slate-500'>正在加载通知…</p>}
        {error && <p className='py-12 text-center text-red-600'>通知加载失败，请稍后重试。</p>}
        {!isLoading && !error && notifications.length === 0 && (
          <p className='py-12 text-center text-slate-500'>
            暂无{filter === 'unread' ? '未读' : ''}通知
          </p>
        )}

        <div className='space-y-3'>
          {notifications.map((notification) => {
            const content = (
              <article
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  notification.read_at
                    ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                    : 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40'
                )}
              >
                <div className='flex items-start justify-between gap-3'>
                  <h2 className='font-semibold text-slate-900 dark:text-slate-100'>
                    {notification.title}
                  </h2>
                  {!notification.read_at && (
                    <span className='mt-1 size-2 shrink-0 rounded-full bg-blue-500' />
                  )}
                </div>
                <p className='mt-2 text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300'>
                  {notification.body}
                </p>
                <time className='mt-3 block text-xs text-slate-500'>
                  {formatCompactDateTime(notification.created_at)}
                </time>
              </article>
            );

            return notification.href ? (
              <Link
                key={notification.id}
                href={notification.href}
                onClick={() => void markRead(notification.id)}
              >
                {content}
              </Link>
            ) : (
              <button
                key={notification.id}
                type='button'
                className='block w-full text-left'
                onClick={() => void markRead(notification.id)}
              >
                {content}
              </button>
            );
          })}
        </div>

        {hasMore && (
          <div className='text-center'>
            <Button variant='secondary' onClick={() => void setSize(size + 1)}>
              加载更多
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
