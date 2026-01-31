import type { Metadata } from 'next';

import { OfflinePageClient } from './OfflinePageClient';

export const metadata: Metadata = {
  title: '离线 - 猫鼠wiki',
  description: '您正在离线浏览',
  robots: 'noindex, nofollow',
};

export default function OfflinePage() {
  return <OfflinePageClient />;
}
