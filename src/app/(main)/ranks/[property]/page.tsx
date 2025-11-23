import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FactionId } from '@/data/types';

import {
  getPropertyInfo,
  RANKABLE_PROPERTIES,
  RankableProperty,
} from '@/lib/characterRankingUtils';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { CharacterRankingGrid } from '@/components/displays/characters';

export const dynamic = 'force-static';

interface PageProps {
  params: Promise<{ property: string }>;
  searchParams: Promise<{ faction?: string }>;
}

// Generate static params for all rankable properties
export function generateStaticParams() {
  return RANKABLE_PROPERTIES.map((property) => ({
    property: property.key,
  }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const propertyInfo = getPropertyInfo(resolvedParams.property as RankableProperty);
  const factionId = resolvedSearchParams.faction as FactionId | undefined;

  if (!propertyInfo) {
    return {};
  }

  const factionSuffix = factionId ? ` - ${factionId === 'cat' ? '猫阵营' : '鼠阵营'}` : '';

  return generatePageMetadata({
    title: `${propertyInfo.label}排行榜${factionSuffix}`,
    description: `查看猫和老鼠手游中所有角色在${propertyInfo.label}属性上的排名对比。${propertyInfo.description}`,
    keywords: [propertyInfo.label, '角色排行榜', '属性对比'],
    canonicalUrl: `https://tjwiki.com/ranks/${resolvedParams.property}${factionId ? `?faction=${factionId}` : ''}`,
  });
}

export default async function PropertyRankPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const property = resolvedParams.property as RankableProperty;
  const factionId = resolvedSearchParams.faction as FactionId | undefined;

  const propertyInfo = getPropertyInfo(property);

  if (!propertyInfo) {
    notFound();
  }

  // Validate faction if provided
  if (factionId && factionId !== 'cat' && factionId !== 'mouse') {
    notFound();
  }

  return (
    <div className='mx-auto max-w-7xl space-y-6 p-6' style={{ paddingTop: '80px' }}>
      <CharacterRankingGrid initialProperty={property} />
    </div>
  );
}
