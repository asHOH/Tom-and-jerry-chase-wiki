import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { createArticleJsonLd, generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { getItemGroupImageUrl } from '@/features/items/components/itemGroups/itemGroup-grid/getItemGroupImageUrl';
import StructuredData from '@/components/StructuredData';
import { itemGroups } from '@/data';

import ItemGroupDetailClient from './ItemGroupDetailsClient';

export function generateStaticParams() {
  return Object.keys(itemGroups).map((itemGroupName) => ({
    itemGroupName,
  }));
}

function generateStructuredData(itemGroupName: string) {
  const itemGroup = itemGroups[itemGroupName]!;
  const desc = itemGroup.description ?? `${itemGroup.name}详细信息`;
  return createArticleJsonLd({
    headline: itemGroup.name,
    description: desc,
    image: getItemGroupImageUrl(itemGroup),
    path: `/itemGroups/${encodeURIComponent(itemGroupName)}`,
  });
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
    canonicalUrl: getCanonicalUrl(`/itemGroups/${encodeURIComponent(itemGroupName)}`),
    imageUrl: getItemGroupImageUrl(itemGroup),
  });
}

export default async function ItemGroupDetailPage({
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
