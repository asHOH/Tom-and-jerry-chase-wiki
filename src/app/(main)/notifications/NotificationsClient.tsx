'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { getNotificationKindMeta } from '@/lib/notifications/kinds';
import type { NotificationSubscriptionResponse } from '@/lib/notifications/subscriptionSettings';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormControls';
import LoadingState from '@/components/ui/LoadingState';
import Notice, { type NoticeVariant } from '@/components/ui/Notice';
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

type EmailSettings = {
  email: string | null;
  enabled: boolean;
  verifiedAt: string | null;
  pendingEmail: string | null;
  verificationExpiresAt: string | null;
};

type EmailMessage = { text: string; variant: NoticeVariant };
type PreferenceMessage = { text: string; variant: NoticeVariant };
type NotificationPreferenceKey = keyof Omit<NotificationSubscriptionResponse, 'availability'>;

const SUBSCRIPTION_OPTIONS: Array<{
  key: NotificationPreferenceKey;
  label: string;
  description: string;
  availabilityKey: keyof NotificationSubscriptionResponse['availability'];
}> = [
  {
    key: 'articleVersionPendingEnabled',
    label: '新待审核文章',
    description: '拥有文章审核权限的用户可接收新待审核文章提醒。',
    availabilityKey: 'articleVersionPendingAvailable',
  },
  {
    key: 'gameDataActionPendingEnabled',
    label: '新待审核游戏数据改动',
    description: '拥有游戏数据审核权限的用户可接收新待审核改动提醒。',
    availabilityKey: 'gameDataActionPendingAvailable',
  },
  {
    key: 'discussionCommentEnabled',
    label: '非文章讨论区新评论',
    description:
      '接收非文章讨论页的新评论站内通知，不包含文章评论；您自己文章的评论通知仍会照常发送。仅站内通知，不发送邮件。',
    availabilityKey: 'discussionCommentAvailable',
  },
];

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
  const [preferenceMessage, setPreferenceMessage] = useState<PreferenceMessage | null>(null);
  const [preferenceBusyKey, setPreferenceBusyKey] = useState<NotificationPreferenceKey | null>(
    null
  );

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
    data: notificationPreferences,
    mutate: mutateNotificationPreferences,
    error: notificationPreferencesError,
    isLoading: notificationPreferencesLoading,
  } = useSWR<NotificationSubscriptionResponse>('/api/notifications/preferences', jsonFetcher);
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

  const togglePreference = async (key: NotificationPreferenceKey) => {
    if (!notificationPreferences) return;

    setPreferenceBusyKey(key);
    setPreferenceMessage(null);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !notificationPreferences[key] }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || '站内订阅设置更新失败。');
      }

      setPreferenceMessage({ text: '站内订阅设置已更新。', variant: 'success' });
      await mutateNotificationPreferences();
    } catch (preferenceError) {
      setPreferenceMessage({
        text: preferenceError instanceof Error ? preferenceError.message : '站内订阅设置更新失败。',
        variant: 'error',
      });
    } finally {
      setPreferenceBusyKey(null);
    }
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
    <PageShell width='standard' className='space-y-8 py-8 text-gray-900 dark:text-gray-100'>
      <PageHeader title='通知中心' description='查看站内通知，管理站内订阅与邮件设置' />

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start'>
        <Card as='section' className='border-border order-2 overflow-hidden border p-0 lg:order-1'>
          <div className='border-border border-b px-4 py-4 sm:px-5'>
            <SectionHeader title='通知记录'>
              {unreadCount > 0 && (
                <span className='rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'>
                  {unreadCount} 条未读
                </span>
              )}
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
                        ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-700 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                    )}
                    onClick={() => setFilter(value)}
                  >
                    {value === 'all' ? '全部' : '未读'}
                  </Button>
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
              <Card bordered className='bg-background/60 border-dashed px-5 py-12 text-center'>
                <div className='mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300'>
                  <CheckCircleIcon className='size-6' />
                </div>
                <p className='font-medium text-gray-700 dark:text-gray-200'>
                  暂无{filter === 'unread' ? '未读' : ''}通知
                </p>
                <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                  站内通知会显示在这里
                </p>
              </Card>
            )}

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
                        ? 'hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-600 dark:hover:bg-gray-700/70'
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

            {hasMore && (
              <div className='pt-4 text-center'>
                <Button variant='secondary' onClick={() => void setSize(size + 1)}>
                  加载更多
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card as='aside' className='border-border order-1 border lg:sticky lg:top-24 lg:order-2'>
          <SectionHeader title='站内订阅' />
          <p className='mb-4 text-sm leading-6 text-gray-600 dark:text-gray-300'>
            按需接收全站范围的待审核提醒和讨论更新。
          </p>

          {notificationPreferencesError ? (
            <Notice variant='error'>站内订阅设置加载失败。</Notice>
          ) : notificationPreferencesLoading ? (
            <LoadingState message='正在加载站内订阅设置…' />
          ) : (
            <div className='space-y-3'>
              {SUBSCRIPTION_OPTIONS.map((item) => {
                const checked = notificationPreferences?.[item.key] ?? false;
                const available =
                  notificationPreferences?.availability[item.availabilityKey] ?? false;
                const disabled = !available || preferenceBusyKey !== null;

                return (
                  <Card
                    as='label'
                    bordered
                    key={item.key}
                    className={cn('flex items-start gap-3 px-3 py-3', !available && 'opacity-75')}
                  >
                    <input
                      type='checkbox'
                      checked={checked}
                      disabled={disabled}
                      onChange={() => void togglePreference(item.key)}
                      className='mt-1 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900'
                    />
                    <span className='min-w-0'>
                      <span className='block text-sm font-medium text-gray-900 dark:text-gray-100'>
                        {item.label}
                      </span>
                      <span className='mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400'>
                        {item.description}
                      </span>
                      {!available && (
                        <span className='mt-1 block text-xs text-amber-600 dark:text-amber-300'>
                          当前账号暂无对应权限，无法启用此订阅。
                        </span>
                      )}
                    </span>
                  </Card>
                );
              })}

              {preferenceMessage && (
                <Notice variant={preferenceMessage.variant}>{preferenceMessage.text}</Notice>
              )}
            </div>
          )}

          <div className='border-border mt-6 border-t pt-6'>
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
                  <Card bordered className='p-3'>
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
                    <div className='border-border mt-3 flex gap-2 border-t pt-3'>
                      <Button
                        size='sm'
                        variant='secondary'
                        loading={emailBusy}
                        onClick={toggleEmail}
                      >
                        {emailSettings.enabled ? '停用邮件' : '启用邮件'}
                      </Button>
                      <Button size='sm' variant='ghost' disabled={emailBusy} onClick={removeEmail}>
                        移除
                      </Button>
                    </div>
                  </Card>
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

                {emailMessage && (
                  <Notice variant={emailMessage.variant}>{emailMessage.text}</Notice>
                )}

                <p className='text-xs leading-5 text-gray-500 dark:text-gray-400'>
                  我们仅会向此邮箱发送通知邮件。您可以随时停用邮件或取消订阅。
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
