import { Metadata } from 'next';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import FixtureClient from './FixtureGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '功能各异的地图组件——地图的基础组成部分';

export const metadata: Metadata = generatePageMetadata({
  title: '地图组件',
  description: DESCRIPTION,
  keywords: ['地图组件'],
  canonicalUrl: `${SITE_URL}/fixtures`,
});

export default async function FixturesPage() {
  const readModel = await getPublishedDomainReadModel('fixtures');
  return (
    <FixtureClient
      description={DESCRIPTION}
      data={readModel.data}
      publishedRevision={readModel.revision}
    />
  );
}
