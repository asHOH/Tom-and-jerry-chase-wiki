import { Metadata } from 'next';

import { getPublishedDomainsReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import PublishedRevisionBoundary from '@/components/PublishedRevisionBoundary';

import SpecialSkillAdviceClient from './SpecialSkillAdviceClient';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '特技推荐',
  description: '列出常用特技及特技克制关系，便于新手进行选择',
  keywords: ['特技'],
  canonicalUrl: `${SITE_URL}/special-skills/advice`,
});

export default async function SpecialSkillsPage() {
  const { data, revisions } = await getPublishedDomainsReadModel(['characters', 'specialSkills']);

  return (
    <PublishedRevisionBoundary revisions={[revisions.specialSkills]}>
      <SpecialSkillAdviceClient
        charactersData={data.characters}
        specialSkillsData={data.specialSkills}
        publishedRevision={revisions.characters}
      />
    </PublishedRevisionBoundary>
  );
}
