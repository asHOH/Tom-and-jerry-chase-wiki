'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { cn } from '@/lib/design';
import type { NotificationSubscriptionResponse } from '@/lib/notifications/subscriptionSettings';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormControls';
import LoadingState from '@/components/ui/LoadingState';
import Notice, { type NoticeVariant } from '@/components/ui/Notice';
import SectionHeader from '@/components/ui/SectionHeader';

type EmailSettings = {
  email: string | null;
  enabled: boolean;
  verifiedAt: string | null;
  pendingEmail: string | null;
  verificationExpiresAt: string | null;
};

type SettingsMessage = { text: string; variant: NoticeVariant };
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

export default function NotificationSettings() {
  const searchParams = useSearchParams();
  const [emailInput, setEmailInput] = useState('');
  const [emailMessage, setEmailMessage] = useState<SettingsMessage | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState<SettingsMessage | null>(null);
  const [preferenceBusyKey, setPreferenceBusyKey] = useState<NotificationPreferenceKey | null>(
    null
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

  useEffect(() => {
    const emailStatus = searchParams.get('email');
    if (emailStatus === 'verified')
      setEmailMessage({ text: '通知邮箱验证成功。', variant: 'success' });
    if (emailStatus === 'invalid')
      setEmailMessage({ text: '验证链接无效或已过期。', variant: 'error' });
    if (emailStatus === 'blocked')
      setEmailMessage({ text: '当前账号被限制使用邮件功能。', variant: 'error' });
  }, [searchParams]);

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
      if (!response.ok) throw new Error(payload?.error || '站内订阅设置更新失败。');
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
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || '验证邮件发送失败');
      setEmailMessage({ text: '验证邮件已发送，请在 30 分钟内完成验证。', variant: 'success' });
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
    <Card as='section' bordered>
      <SectionHeader id='notifications' title='通知设置' variant='compact' />
      <div className='grid gap-8 lg:grid-cols-2'>
        <div>
          <h3 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>站内订阅</h3>
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
                      disabled={!available || preferenceBusyKey !== null}
                      onChange={() => void togglePreference(item.key)}
                      className='bg-surface-sunken mt-1 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600'
                    />
                    <span className='min-w-0'>
                      <span className='block text-sm font-medium text-gray-900 dark:text-gray-100'>
                        {item.label}
                      </span>
                      <span className='mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400'>
                        {item.description}
                      </span>
                      {!available ? (
                        <span className='mt-1 block text-xs text-amber-600 dark:text-amber-300'>
                          当前账号暂无对应权限，无法启用此订阅。
                        </span>
                      ) : null}
                    </span>
                  </Card>
                );
              })}
              {preferenceMessage ? (
                <Notice variant={preferenceMessage.variant}>{preferenceMessage.text}</Notice>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <h3 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>邮件通知</h3>
          <p className='mb-4 text-sm leading-6 text-gray-600 dark:text-gray-300'>
            将站内通知同步发送到您验证过的邮箱。
          </p>
          {emailSettingsError ? (
            <Notice variant='error'>邮件设置加载失败。</Notice>
          ) : emailSettingsLoading ? (
            <LoadingState message='正在加载邮件设置…' />
          ) : (
            <div className='space-y-4'>
              {emailSettings?.email ? (
                <Card bordered className='p-3'>
                  <p className='truncate text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    {emailSettings.email}
                  </p>
                  <p className='mt-2 text-xs text-gray-600 dark:text-gray-300'>
                    {emailSettings.enabled ? '通知邮件已启用' : '通知邮件已停用'}
                  </p>
                  <div className='border-border mt-3 flex gap-2 border-t pt-3'>
                    <Button size='sm' variant='secondary' loading={emailBusy} onClick={toggleEmail}>
                      {emailSettings.enabled ? '停用邮件' : '启用邮件'}
                    </Button>
                    <Button size='sm' variant='ghost' disabled={emailBusy} onClick={removeEmail}>
                      移除
                    </Button>
                  </div>
                </Card>
              ) : null}
              {emailSettings?.pendingEmail ? (
                <Notice variant='warning'>等待验证：{emailSettings.pendingEmail}</Notice>
              ) : null}
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
                  autoComplete='email'
                  required
                />
                <Button type='submit' loading={emailBusy} fullWidth>
                  发送验证邮件
                </Button>
              </form>
              {emailMessage ? (
                <Notice variant={emailMessage.variant}>{emailMessage.text}</Notice>
              ) : null}
              <p className='text-xs leading-5 text-gray-500 dark:text-gray-400'>
                我们仅会向此邮箱发送通知邮件。您可以随时停用邮件或取消订阅。
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
