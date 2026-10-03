import { Suspense } from 'react';
import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import LoadingState from '@/components/ui/LoadingState';

import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = generatePageMetadata({
  title: '通知',
  description: '查看和管理站内通知',
  canonicalUrl: getCanonicalUrl('/notifications'),
  robots: { index: false },
});

export default function NotificationsPage() {
  return (
    <Suspense fallback={<LoadingState message='正在加载通知…' />}>
      <NotificationsClient />
    </Suspense>
  );
}
