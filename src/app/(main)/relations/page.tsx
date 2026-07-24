import { Metadata } from 'next';

import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

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
  const snapshot = await getPublishedGameDataSnapshot();
  const data = {
    characters: snapshot.data.characters,
    cards: snapshot.data.cards,
    specialSkills: snapshot.data.specialSkills,
    maps: snapshot.data.maps,
    modes: snapshot.data.modes,
  };

  return (
    <RelationsClient description={DESCRIPTION} data={data} publishedRevision={snapshot.revision} />
  );
}
