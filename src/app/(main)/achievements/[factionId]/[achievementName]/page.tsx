import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import type { Achievement, FactionId } from '@/data/types';
import StructuredData from '@/components/StructuredData';
import { achievements } from '@/data';

import AchievementDetailsClient from './AchievementDetailsClient';

function getAchievement(factionId: string, achievementName: string): Achievement | undefined {
  if (factionId !== 'cat' && factionId !== 'mouse') return undefined;
  return achievements[factionId][achievementName];
}

export function generateStaticParams() {
  return (['cat', 'mouse'] as const).flatMap((factionId) =>
    Object.keys(achievements[factionId]).map((achievementName) => ({
      factionId,
      achievementName,
    }))
  );
}

function generateStructuredData(factionId: FactionId, achievementName: string) {
  const achievement = getAchievement(factionId, achievementName)!;
  const desc = achievement.description ?? `${achievement.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: achievement.name,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    image: achievement.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/achievements/${factionId}/${encodeURIComponent(achievementName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ factionId: string; achievementName: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const factionId = decodeURIComponent(resolvedParams.factionId);
  const achievementName = decodeURIComponent(resolvedParams.achievementName);
  const achievement = getAchievement(factionId, achievementName);

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
  const achievement = getAchievement(factionId, achievementName);
  if (!achievement) notFound();

  return (
    <>
      <StructuredData data={generateStructuredData(factionId, achievementName)} />
      <AchievementDetailsClient
        achievement={achievement}
        factionId={factionId}
        achievementName={achievementName}
      />
    </>
  );
}
