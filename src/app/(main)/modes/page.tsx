import { Metadata } from 'next';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import ModeClient from './ModeGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '收录当前已上线的全部游戏模式';

export const metadata: Metadata = generatePageMetadata({
  title: '游戏模式',
  description: DESCRIPTION,
  keywords: ['游戏模式'],
  canonicalUrl: `${SITE_URL}/modes`,
});

export default async function ModesPage() {
  const readModel = await getPublishedDomainReadModel('modes');
  return (
    <ModeClient
      description={DESCRIPTION}
      data={readModel.data}
      publishedRevision={readModel.revision}
    />
  );
}
