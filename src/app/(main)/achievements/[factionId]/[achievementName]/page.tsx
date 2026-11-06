import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedReferenceRoute } from '@/lib/gameData/published/referenceRoute';
import { getReferenceActionSnapshot } from '@/lib/gameData/published/reverseReferences';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { createArticleJsonLd, generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { achievements as canonicalAchievements } from '@/data/static';
import type { Achievement, FactionId } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import AchievementDetailsClient from './AchievementDetailsClient';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return (['cat', 'mouse'] as const).flatMap((factionId) =>
    Object.keys(canonicalAchievements[factionId]).map((achievementName) => ({
      factionId,
      achievementName,
    }))
  );
}

function generateStructuredData(
  factionId: FactionId,
  achievementName: string,
  achievement: Achievement
) {
  const desc = achievement.description ?? `${achievement.name}详细信息`;
  return createArticleJsonLd({
    headline: achievement.name,
    description: desc,
    image: achievement.imageUrl,
    path: `/achievements/${factionId}/${encodeURIComponent(achievementName)}`,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ factionId: string; achievementName: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const factionId = decodeURIComponent(resolvedParams.factionId);
  const achievementName = decodeURIComponent(resolvedParams.achievementName);
  if (factionId !== 'cat' && factionId !== 'mouse') return {};
  const snapshot = await getReferenceActionSnapshot();
  const { data: achievement } = await getPublishedEntityRouteReadModel(
    'achievements',
    achievementName,
    factionId,
    snapshot
  );

  if (!achievement) return {};

  const desc = achievement.description ?? `${achievement.name}详细信息`;
  return generateArticleMetadata({
    title: achievement.name,
    description: desc,
    keywords: [achievement.name, '对局成就', '成就'],
    canonicalUrl: getCanonicalUrl(
      `/achievements/${factionId}/${encodeURIComponent(achievementName)}`
    ),
    imageUrl: achievement.imageUrl,
  });
}

export default async function AchievementDetailPage({
  params,
}: {
  params: Promise<{ factionId: string; achievementName: string }>;
}) {
  const resolvedParams = await params;
  const factionIdRaw = decodeURIComponent(resolvedParams.factionId);
  const achievementName = decodeURIComponent(resolvedParams.achievementName);

  if (factionIdRaw !== 'cat' && factionIdRaw !== 'mouse') notFound();

  const factionId = factionIdRaw as FactionId;
  const readModel = await getPublishedReferenceRoute('achievements', achievementName, factionId);
  if (!readModel) notFound();
  const achievement = readModel.data;
  return (
    <>
      <StructuredData data={generateStructuredData(factionId, achievementName, achievement)} />
      <AchievementDetailsClient
        achievement={achievement}
        factionId={factionId}
        achievementName={achievementName}
        referencePage={readModel.referencePage}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
      />
    </>
  );
}
