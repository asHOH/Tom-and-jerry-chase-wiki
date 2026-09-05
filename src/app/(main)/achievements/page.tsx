import type { Metadata } from 'next';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import PageShell from '@/components/ui/PageShell';

import AchievementGridClient from './AchievementGridClient';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '对局成就列表',
  description: '查询猫和老鼠手游的所有对局成就信息。',
  canonicalUrl: getCanonicalUrl('/achievements'),
});

export default async function AchievementsPage() {
  const readModel = await getPublishedDomainReadModel('achievements');

  return (
    <PageShell width='maximum' className='py-8'>
      <AchievementGridClient data={readModel.data} publishedRevision={readModel.revision} />
    </PageShell>
  );
}
