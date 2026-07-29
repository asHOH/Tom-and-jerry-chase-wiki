import { Metadata } from 'next';

import { getApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
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

export default async function RecommendedPage() {
  const snapshot = await getApprovedActionSnapshot();
  const [characters, maps] = await Promise.all([
    getPublishedDomainReadModel('characters', snapshot),
    getPublishedDomainReadModel('maps', snapshot),
  ]);
  return <RecommendedPageClient characters={characters.data} maps={maps.data} />;
}
