import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import StructuredData from '@/components/StructuredData';
import { achievements } from '@/data';

import AchievementDetailsClient from './AchievementDetailsClient';

export function generateStaticParams() {
  return Object.keys(achievements).map((achievementName) => ({
    achievementName,
  }));
}

function generateStructuredData(achievementName: string) {
  const achievement = achievements[achievementName]!;
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
      '@id': `${SITE_URL}/achievements/${encodeURIComponent(achievementName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ achievementName: string }>;
}): Promise<Metadata> {
  const achievementName = decodeURIComponent((await params).achievementName);
  const achievement = achievements[achievementName];

  if (!achievement) {
    return {};
  }

  const desc = achievement.description ?? `${achievement.name}详细信息`;
  return generateArticleMetadata({
    title: achievement.name,
    description: desc,
    keywords: [achievement.name, '对局成就', '成就'],
    canonicalUrl: getCanonicalUrl(`/achievements/${encodeURIComponent(achievementName)}`),
    imageUrl: achievement.imageUrl,
  });
}

export default async function AchievementDetailPage({
  params,
}: {
  params: Promise<{ achievementName: string }>;
}) {
  const achievementName = decodeURIComponent((await params).achievementName);
  const achievement = achievements[achievementName];

  if (!achievement) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(achievementName)} />
      <AchievementDetailsClient achievement={achievement} />
    </>
  );
}
