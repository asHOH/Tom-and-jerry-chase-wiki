import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateArticleMetadata } from '@/lib/metadataUtils';
import MechanicsSection from '@/components/displays/mechanics/mechanicsSection';
import {
  mechanicsSectionsList,
  NAV_ITEM_CONFIGS,
  type SectionName,
} from '@/components/displays/mechanics/sections';

const DESCRIPTION = '详细介绍游戏内的局内机制（该界面建设中）';

// Generate static params for all mechanics sections
export function generateStaticParams() {
  return mechanicsSectionsList.map((sectionName) => ({
    sectionName,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sectionName: string }>;
}): Promise<Metadata> {
  const sectionName = decodeURIComponent((await params).sectionName);
  const isEffectiveSection = mechanicsSectionsList.includes(sectionName as SectionName);
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
    canonicalUrl: `https://tjwiki.com/mechanics/${encodeURIComponent(sectionName)}`,
  });
}

export default async function MechanicsDetailPage({
  params,
}: {
  params: Promise<{ sectionName: string }>;
}) {
  const sectionName = decodeURIComponent((await params).sectionName);
  const isEffectiveSection = mechanicsSectionsList.includes(sectionName as SectionName);
  if (!isEffectiveSection) {
    notFound();
  }

  // 将 sectionName 转换为 SectionName 类型
  const typedSectionName = sectionName as SectionName;

  return <MechanicsSection sectionName={typedSectionName} description={DESCRIPTION} />;
}
