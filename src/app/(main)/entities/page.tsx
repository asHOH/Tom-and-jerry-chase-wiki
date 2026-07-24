import { Metadata } from 'next';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import EntityClient from './EntityGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '由角色技能或其它方式衍生出的独立物体，具有各自独特的作用';

export const metadata: Metadata = generatePageMetadata({
  title: '衍生物',
  description: DESCRIPTION,
  keywords: ['衍生物'],
  canonicalUrl: `${SITE_URL}/entities`,
});

export default async function EntitysPage() {
  const readModel = await getPublishedDomainReadModel('entities');
  return (
    <EntityClient
      description={DESCRIPTION}
      data={readModel.data}
      publishedRevision={readModel.revision}
    />
  );
}
