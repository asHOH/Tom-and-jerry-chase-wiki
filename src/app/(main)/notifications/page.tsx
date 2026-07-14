import { Suspense } from 'react';
import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';

import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = generatePageMetadata({
  title: '通知',
  description: '查看审核结果通知并管理通知邮箱',
  canonicalUrl: getCanonicalUrl('/notifications'),
  robots: { index: false },
});

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className='py-12 text-center text-slate-500'>正在加载通知…</div>}>
      <NotificationsClient />
    </Suspense>
  );
}
