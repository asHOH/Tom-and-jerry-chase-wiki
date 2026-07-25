'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { getNotificationKindMeta } from '@/lib/notifications/kinds';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormControls';
import LoadingState from '@/components/ui/LoadingState';
import Notice, { type NoticeVariant } from '@/components/ui/Notice';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
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

type EmailSettings = {
  email: string | null;
  enabled: boolean;
  verifiedAt: string | null;
  pendingEmail: string | null;
  verificationExpiresAt: string | null;
};

type EmailMessage = { text: string; variant: NoticeVariant };

const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('请求失败');
  return (await response.json()) as T;
};

export default function NotificationsClient() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [emailInput, setEmailInput] = useState('');
  const [emailMessage, setEmailMessage] = useState<EmailMessage | null>(null);
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
    isLoading: emailSettingsLoading,
  } = useSWR<EmailSettings>('/api/notifications/email', jsonFetcher);

  const notifications = data?.flatMap((page) => page.notifications) ?? [];
  const unreadCount = data?.[0]?.unreadCount ?? 0;
  const hasMore = !!data?.at(-1)?.nextCursor;

  useEffect(() => {
    const emailStatus = searchParams.get('email');
    if (emailStatus === 'verified') {
      setEmailMessage({ text: '通知邮箱验证成功。', variant: 'success' });
    }
    if (emailStatus === 'invalid') {
      setEmailMessage({ text: '验证链接无效或已过期。', variant: 'error' });
    }
    if (emailStatus === 'blocked') {
      setEmailMessage({ text: '当前账号被限制使用邮件功能。', variant: 'error' });
    }
  }, [searchParams]);

  const markRead = async (notificationId?: string) => {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationId ? { notificationId } : { markAll: true }),
    });
    if (response.ok) await mutate();
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
      setEmailMessage({
        text: '验证邮件已发送，请在 30 分钟内完成验证。',
        variant: 'success',
      });
      setEmailInput('');
      await mutateEmailSettings();
    } catch (requestError) {
      setEmailMessage({
        text: requestError instanceof Error ? requestError.message : '验证邮件发送失败',
        variant: 'error',
      });
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
    setEmailMessage({
      text: response.ok ? '邮件通知设置已更新。' : '邮件通知设置更新失败。',
      variant: response.ok ? 'success' : 'error',
    });
    await mutateEmailSettings();
    setEmailBusy(false);
  };

  const removeEmail = async () => {
    if (!window.confirm('确认移除通知邮箱？')) return;
    setEmailBusy(true);
    const response = await fetch('/api/notifications/email', { method: 'DELETE' });
    setEmailMessage({
      text: response.ok ? '通知邮箱已移除。' : '通知邮箱移除失败。',
      variant: response.ok ? 'success' : 'error',
    });
    await mutateEmailSettings();
    setEmailBusy(false);
  };

  return (
    <main className='mx-auto w-full max-w-5xl space-y-8 px-4 py-8 text-gray-900 sm:px-6 dark:text-gray-100'>
      <header className='text-center'>
        <PageTitle>通知中心</PageTitle>
        <PageDescription>查看站内通知，管理邮件接收设置</PageDescription>
      </header>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start'>
        <Card
          as='section'
          className='order-2 overflow-hidden border border-gray-200 p-0 lg:order-1 dark:border-gray-700'
        >
          <div className='border-b border-gray-200 px-4 py-4 sm:px-5 dark:border-gray-700'>
            <SectionHeader title='通知记录'>
              {unreadCount > 0 && (
                <span className='rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'>
                  {unreadCount} 条未读
                </span>
              )}
            </SectionHeader>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-900/60'>
                {(['all', 'unread'] as const).map((value) => (
                  <button
                    key={value}
                    type='button'
                    aria-pressed={filter === value}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      filter === value
                        ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-700 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                    )}
                    onClick={() => setFilter(value)}
                  >
                    {value === 'all' ? '全部' : '未读'}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <Button size='sm' variant='ghost' onClick={() => void markRead()}>
                  全部标为已读
                </Button>
              )}
            </div>
          </div>

          <div className='p-3 sm:p-4'>
            {isLoading && <LoadingState message='正在加载通知…' />}
            {error && <Notice variant='error'>通知加载失败，请稍后重试。</Notice>}
            {!isLoading && !error && notifications.length === 0 && (
              <div className='rounded-lg border border-dashed border-gray-300 bg-gray-50/70 px-5 py-12 text-center dark:border-gray-600 dark:bg-gray-900/30'>
                <div className='mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300'>
                  <CheckCircleIcon className='size-6' />
                </div>
                <p className='font-medium text-gray-700 dark:text-gray-200'>
                  暂无{filter === 'unread' ? '未读' : ''}通知
                </p>
                <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                  站内通知会显示在这里
                </p>
              </div>
            )}

            <div className='space-y-2'>
              {notifications.map((notification) => {
                const kindMeta = getNotificationKindMeta(notification.kind);
                const content = (
                  <article
                    className={cn(
                      'group flex gap-3 rounded-lg border px-3.5 py-3.5 transition-all sm:gap-4 sm:px-4',
                      notification.read_at
                        ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700/70'
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
                        {!notification.read_at && (
                          <span className='mt-1.5 size-2 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/50' />
                        )}
                      </div>
                      <p className='mt-1.5 text-sm leading-6 whitespace-pre-wrap text-gray-600 dark:text-gray-300'>
                        {notification.body}
                      </p>
                      <div className='mt-2 flex items-center justify-between gap-3'>
                        <time className='text-xs text-gray-500 dark:text-gray-400'>
                          {formatCompactDateTime(notification.created_at)}
                        </time>
                        {notification.href && (
                          <span className='text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400'>
                            查看详情 →
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
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
                  <button
                    key={notification.id}
                    type='button'
                    className='block w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
                    onClick={() => void markRead(notification.id)}
                  >
                    {content}
                  </button>
                );
              })}
            </div>

            {hasMore && (
              <div className='pt-4 text-center'>
                <Button variant='secondary' onClick={() => void setSize(size + 1)}>
                  加载更多
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card
          as='aside'
          className='order-1 border border-gray-200 lg:sticky lg:top-24 lg:order-2 dark:border-gray-700'
        >
          <SectionHeader title='邮件通知' />
          <p className='mb-4 text-sm leading-6 text-gray-600 dark:text-gray-300'>
            将站内通知同步发送到您验证过的邮箱。
          </p>

          {emailSettingsError ? (
            <Notice variant='error'>邮件设置加载失败。</Notice>
          ) : emailSettingsLoading ? (
            <LoadingState message='正在加载邮件设置…' />
          ) : (
            <div className='space-y-4'>
              {emailSettings?.email && (
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-900/40'>
                  <p className='truncate text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    {emailSettings.email}
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        emailSettings.enabled ? 'bg-green-500' : 'bg-gray-400'
                      )}
                    />
                    <span className='text-xs text-gray-600 dark:text-gray-300'>
                      {emailSettings.enabled ? '通知邮件已启用' : '通知邮件已停用'}
                    </span>
                  </div>
                  <div className='mt-3 flex gap-2 border-t border-gray-200 pt-3 dark:border-gray-700'>
                    <Button size='sm' variant='secondary' loading={emailBusy} onClick={toggleEmail}>
                      {emailSettings.enabled ? '停用邮件' : '启用邮件'}
                    </Button>
                    <Button size='sm' variant='ghost' disabled={emailBusy} onClick={removeEmail}>
                      移除
                    </Button>
                  </div>
                </div>
              )}

              {emailSettings?.pendingEmail && (
                <Notice variant='warning'>等待验证：{emailSettings.pendingEmail}</Notice>
              )}

              <form className='space-y-3' onSubmit={requestVerification}>
                <label
                  htmlFor='notification-email'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-200'
                >
                  {emailSettings?.email ? '更换通知邮箱' : '添加通知邮箱'}
                </label>
                <FormInput
                  id='notification-email'
                  type='email'
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder='name@example.com'
                  autoComplete='email'
                  required
                />
                <Button type='submit' loading={emailBusy} fullWidth>
                  发送验证邮件
                </Button>
              </form>

              {emailMessage && <Notice variant={emailMessage.variant}>{emailMessage.text}</Notice>}

              <p className='text-xs leading-5 text-gray-500 dark:text-gray-400'>
                我们仅会向此邮箱发送通知邮件。您可以随时停用邮件或取消订阅。
              </p>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
