'use client';

import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { useUser } from '@/hooks/useUser';
import Notice from '@/components/ui/Notice';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';

import ChangePasswordSettings from './ChangePasswordSettings';
import LocalSettings from './LocalSettings';
import NotificationSettings from './NotificationSettings';

export default function SettingsClient() {
  const { nickname, isLoading } = useUser();
  const accountSettingsAvailable = hasSupabasePublicConfig();

  return (
    <PageShell width='standard' className='space-y-8 py-8'>
      <PageHeader title='设置' description='管理此浏览器的显示偏好、本地数据和账号设置' />
      <LocalSettings />

      {accountSettingsAvailable && nickname ? (
        <div className='space-y-8'>
          <ChangePasswordSettings />
          <NotificationSettings />
        </div>
      ) : accountSettingsAvailable && !isLoading ? (
        <Notice>登录后可在此修改密码、管理站内订阅和通知邮箱。本地设置无需登录即可使用。</Notice>
      ) : null}
    </PageShell>
  );
}
