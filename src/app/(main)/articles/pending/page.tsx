import { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';

import PendingClient from './PendingClient';

export const metadata: Metadata = generatePageMetadata({
  title: '待审核文章',
  description: '查看猫和老鼠手游文章',
  keywords: ['待审核', '文章', '猫和老鼠', '手游'],
  canonicalUrl: getCanonicalUrl('/articles/pending'),
  robots: { index: false },
});

export default function PendingModerationPage() {
  return <PendingClient />;
}
