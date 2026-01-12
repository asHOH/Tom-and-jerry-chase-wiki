import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateArticleMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { NAV_ITEM_CONFIGS, usagesSectionsList, type SectionName } from '@/features/usages/sections';
import UsagesSection from '@/features/usages/usagesSection';

const DESCRIPTION = '详细介绍游戏内的局内机制（该界面建设中）';

// Generate static params for all usages sections
export function generateStaticParams() {
  return usagesSectionsList.map((sectionName) => ({
    sectionName,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sectionName: string }>;
}): Promise<Metadata> {
  const sectionName = decodeURIComponent((await params).sectionName);
  const isEffectiveSection = usagesSectionsList.includes(sectionName as SectionName);
  if (!isEffectiveSection) {
    return {};
  }

  // 从 NAV_ITEM_CONFIGS 中查找对应的中文名称
  const sectionConfig = NAV_ITEM_CONFIGS.find((config) => config.id === sectionName);
  const sectionChineseName = sectionConfig?.label || '局内机制';

  return generateArticleMetadata({
    title: sectionChineseName,
    description: DESCRIPTION,
    keywords: [sectionChineseName],
    canonicalUrl: `${SITE_URL}/usages/${encodeURIComponent(sectionName)}`,
  });
}

export default async function UsagesDetailPage({
  params,
}: {
  params: Promise<{ sectionName: string }>;
}) {
  const sectionName = decodeURIComponent((await params).sectionName);
  const isEffectiveSection = usagesSectionsList.includes(sectionName as SectionName);
  if (!isEffectiveSection) {
    notFound();
  }

  // 将 sectionName 转换为 SectionName 类型
  const typedSectionName = sectionName as SectionName;

  return <UsagesSection sectionName={typedSectionName} description={DESCRIPTION} />;
}
