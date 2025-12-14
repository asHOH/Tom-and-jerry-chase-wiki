import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { itemGroups } from '@/data';
import { getItemGroupImageUrl } from '@/features/items/components/itemGroups/itemGroup-grid/getItemGroupImageUrl';

import { generateArticleMetadata } from '@/lib/metadataUtils';
import StructuredData from '@/components/StructuredData';

import ItemGroupDetailClient from './ItemGroupDetailsClient';

// Generate static params for all special skills
export function generateStaticParams() {
  return Object.keys(itemGroups).map((itemGroupName) => ({
    itemGroupName,
  }));
}

function generateStructuredData(itemGroupName: string) {
  const itemGroup = itemGroups[itemGroupName]!;
  const desc = itemGroup.description ?? `${itemGroup.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${itemGroup.name} - 猫鼠wiki`,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    image: getItemGroupImageUrl(itemGroup),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/itemGroups/${encodeURIComponent(itemGroupName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemGroupName: string }>;
}): Promise<Metadata> {
  const itemGroupName = decodeURIComponent((await params).itemGroupName);
  const itemGroup = itemGroups[itemGroupName];

  if (!itemGroup) {
    return {};
  }

  const desc = itemGroup.description ?? `${itemGroup.name}详细信息`;
  return generateArticleMetadata({
    title: itemGroup.name,
    description: desc,
    keywords: [itemGroup.name, '组合'],
    canonicalUrl: `https://tjwiki.com/itemGroups/${encodeURIComponent(itemGroupName)}`,
    imageUrl: getItemGroupImageUrl(itemGroup),
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ itemGroupName: string }>;
}) {
  const itemGroupName = decodeURIComponent((await params).itemGroupName);
  const itemGroup = itemGroups[itemGroupName];

  if (!itemGroup) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(itemGroupName)} />
      <ItemGroupDetailClient itemGroup={itemGroup} />
    </>
  );
}
