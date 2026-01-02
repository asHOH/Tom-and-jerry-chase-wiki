import { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';

import RecommendedPageClient from './RecommendedPageClient';

export const metadata: Metadata = generatePageMetadata({
  title: '阵容推荐',
  description: '根据对手选择的老鼠阵容，推荐最佳的猫角色。',
  canonicalUrl: getCanonicalUrl('/recommended'),
  robots: {
    index: false,
    follow: false,
  },
});

export default function RecommendedPage() {
  return <RecommendedPageClient />;
}
