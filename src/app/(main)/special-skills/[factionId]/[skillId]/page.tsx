import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import { getApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { specialSkills as canonicalSpecialSkills } from '@/data/static';
import type { FactionId, SpecialSkill } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import SpecialSkillDetailClient from './SpecialSkillDetailClient';

// Generate static params for all special skills
export const dynamic = 'force-static';

export function generateStaticParams() {
  return (['cat', 'mouse'] as const).flatMap((factionId) =>
    Object.keys(canonicalSpecialSkills[factionId]).map((skillId) => ({
      factionId,
      skillId,
    }))
  );
}

function generateStructuredData(
  factionId: FactionId,
  skillId: string,
  skill: SpecialSkill
): WithContext<Article> {
  const desc = skill.description ?? `${skill.name}技能详情`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: skill.name,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    image: skill.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/special-skills/${encodeURIComponent(factionId)}/${encodeURIComponent(skillId)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ factionId: string; skillId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const skillId = decodeURIComponent(resolvedParams.skillId);
  const factionIdRaw = decodeURIComponent(resolvedParams.factionId);
  if (factionIdRaw !== 'cat' && factionIdRaw !== 'mouse') {
    return {};
  }
  const factionId = factionIdRaw as FactionId;
  const { data: skill } = await getPublishedEntityRouteReadModel(
    'specialSkills',
    skillId,
    factionId
  );

  if (!skill) {
    return {};
  }

  const desc = skill.description ?? `${skill.name}技能详情`;
  return generateArticleMetadata({
    title: skill.name,
    description: desc,
    keywords: [skill.name, '特殊技能'],
    canonicalUrl: getCanonicalUrl(
      `/special-skills/${encodeURIComponent(factionId)}/${encodeURIComponent(skillId)}`
    ),
    imageUrl: skill.imageUrl,
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ factionId: string; skillId: string }>;
}) {
  const result = await params;
  const skillId = decodeURIComponent(result.skillId);
  const factionIdRaw = decodeURIComponent(result.factionId);
  if (factionIdRaw !== 'cat' && factionIdRaw !== 'mouse') {
    notFound();
  }
  const factionId = factionIdRaw as FactionId;
  const snapshot = await getApprovedActionSnapshot();
  const [readModel, characters] = await Promise.all([
    getPublishedEntityRouteReadModel('specialSkills', skillId, factionId, snapshot),
    getPublishedDomainReadModel('characters', snapshot),
  ]);
  const skill = readModel.data;

  if (!skill) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(factionId, skillId, skill)} />
      <SpecialSkillDetailClient
        skill={skill}
        factionId={factionId}
        skillId={skillId}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
        charactersData={characters.data}
      />
    </>
  );
}
