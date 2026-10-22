import { Metadata } from 'next';

import { getPublishedDomainsReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import PublishedRevisionBoundary from '@/components/PublishedRevisionBoundary';

import RelationsClient from './RelationsClient';

export const dynamic = 'force-static';

const DESCRIPTION = '查看角色间，及角色与知识卡、特技、地图、模式之间的克制和协作关系。';

export const metadata: Metadata = generatePageMetadata({
  title: '角色关系',
  description: DESCRIPTION,
  keywords: ['角色关系', '角色克制', '角色协作'],
  canonicalUrl: `${SITE_URL}/relations`,
});

export default async function RelationsPage() {
  const { data, revisions } = await getPublishedDomainsReadModel([
    'characters',
    'cards',
    'specialSkills',
    'maps',
    'modes',
  ]);

  return (
    <PublishedRevisionBoundary
      revisions={[revisions.cards, revisions.specialSkills, revisions.maps, revisions.modes]}
    >
      <RelationsClient
        description={DESCRIPTION}
        data={data}
        publishedRevision={revisions.characters}
      />
    </PublishedRevisionBoundary>
  );
}
