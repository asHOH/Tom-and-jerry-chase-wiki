import { Metadata } from 'next';

import { getApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
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
  const snapshot = await getApprovedActionSnapshot(
    'characters',
    'cards',
    'specialSkills',
    'maps',
    'modes'
  );
  const [characters, cards, specialSkills, maps, modes] = await Promise.all([
    getPublishedDomainReadModel('characters', snapshot),
    getPublishedDomainReadModel('cards', snapshot),
    getPublishedDomainReadModel('specialSkills', snapshot),
    getPublishedDomainReadModel('maps', snapshot),
    getPublishedDomainReadModel('modes', snapshot),
  ]);
  const data = {
    characters: characters.data,
    cards: cards.data,
    specialSkills: specialSkills.data,
    maps: maps.data,
    modes: modes.data,
  };

  return (
    <PublishedRevisionBoundary
      revisions={[cards.revision, specialSkills.revision, maps.revision, modes.revision]}
    >
      <RelationsClient
        description={DESCRIPTION}
        data={data}
        publishedRevision={characters.revision}
      />
    </PublishedRevisionBoundary>
  );
}
