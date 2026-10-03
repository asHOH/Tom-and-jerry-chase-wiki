import { Suspense } from 'react';
import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import SettingsClient from '@/features/settings/components/SettingsClient';
import LoadingState from '@/components/ui/LoadingState';

export const metadata: Metadata = generatePageMetadata({
  title: '设置',
  description: '管理显示偏好、本地数据和账号设置',
  canonicalUrl: getCanonicalUrl('/settings'),
  robots: { index: false },
});

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingState message='正在加载设置…' />}>
      <SettingsClient />
    </Suspense>
  );
}
