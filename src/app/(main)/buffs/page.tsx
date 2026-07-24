import { Metadata } from 'next';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import BuffClient from './BuffGridClient';

export const dynamic = 'force-static';

const DESCRIPTION = '列举了游戏内的部分常见效果及部分特殊状态';

export const metadata: Metadata = generatePageMetadata({
  title: '状态和效果',
  description: DESCRIPTION,
  keywords: ['状态', '效果', 'buffs', 'debuffs'],
  canonicalUrl: `${SITE_URL}/buffs`,
});

export default async function BuffsPage() {
  const readModel = await getPublishedDomainReadModel('buffs');
  return (
    <BuffClient
      description={DESCRIPTION}
      data={readModel.data}
      publishedRevision={readModel.revision}
    />
  );
}
