import { Suspense } from 'react';
import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import SettingsClient from '@/features/settings/components/SettingsClient';

export const metadata: Metadata = generatePageMetadata({
  title: '设置',
  description: '管理显示偏好、本地数据和账号设置',
  canonicalUrl: getCanonicalUrl('/settings'),
  robots: { index: false },
});

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className='py-12 text-center text-slate-500'>正在加载设置…</div>}>
      <SettingsClient />
    </Suspense>
  );
}
