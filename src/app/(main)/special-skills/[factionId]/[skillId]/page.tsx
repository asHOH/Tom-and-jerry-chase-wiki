import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedReferenceRoute } from '@/lib/gameData/published/referenceRoute';
import { getReferenceActionSnapshot } from '@/lib/gameData/published/reverseReferences';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { createArticleJsonLd, generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
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

function generateStructuredData(factionId: FactionId, skillId: string, skill: SpecialSkill) {
  const desc = skill.description ?? `${skill.name}技能详情`;
  return createArticleJsonLd({
    headline: skill.name,
    description: desc,
    image: skill.imageUrl,
    path: `/special-skills/${encodeURIComponent(factionId)}/${encodeURIComponent(skillId)}`,
  });
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
  const snapshot = await getReferenceActionSnapshot();
  const { data: skill } = await getPublishedEntityRouteReadModel(
    'specialSkills',
    skillId,
    factionId,
    snapshot
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
  const readModel = await getPublishedReferenceRoute('specialSkills', skillId, factionId);
  if (!readModel) notFound();
  const skill = readModel.data;
  return (
    <>
      <StructuredData data={generateStructuredData(factionId, skillId, skill)} />
      <SpecialSkillDetailClient
        skill={skill}
        factionId={factionId}
        skillId={skillId}
        referencePage={readModel.referencePage}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
        charactersData={readModel.charactersData}
      />
    </>
  );
}
