import { Metadata } from 'next';

import { getApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import SpecialSkillAdviceClient from './SpecialSkillAdviceClient';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '特技推荐',
  description: '列出常用特技及特技克制关系，便于新手进行选择',
  keywords: ['特技'],
  canonicalUrl: `${SITE_URL}/special-skills/advice`,
});

export default async function SpecialSkillsPage() {
  const snapshot = await getApprovedActionSnapshot();
  const [characters, specialSkills] = await Promise.all([
    getPublishedDomainReadModel('characters', snapshot),
    getPublishedDomainReadModel('specialSkills', snapshot),
  ]);

  return (
    <SpecialSkillAdviceClient
      charactersData={characters.data}
      specialSkillsData={specialSkills.data}
      publishedRevision={characters.revision}
    />
  );
}
