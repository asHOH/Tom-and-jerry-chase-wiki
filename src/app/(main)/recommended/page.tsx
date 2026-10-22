import { Metadata } from 'next';

import { getPublishedDomainsReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import PublishedRevisionBoundary from '@/components/PublishedRevisionBoundary';

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
  const { data, revisions } = await getPublishedDomainsReadModel(['characters', 'maps']);
  return (
    <PublishedRevisionBoundary revisions={[revisions.characters, revisions.maps]}>
      <RecommendedPageClient characters={data.characters} maps={data.maps} />
    </PublishedRevisionBoundary>
  );
}
