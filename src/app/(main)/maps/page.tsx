import { Metadata } from 'next';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import MapClient from './MapGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '收录游戏中各地图的信息';

export const metadata: Metadata = generatePageMetadata({
  title: '地图',
  description: DESCRIPTION,
  keywords: ['地图'],
  canonicalUrl: `${SITE_URL}/maps`,
});

export default async function ItemsPage() {
  const readModel = await getPublishedDomainReadModel('maps');
  return (
    <MapClient
      description={DESCRIPTION}
      data={readModel.data}
      publishedRevision={readModel.revision}
    />
  );
}
