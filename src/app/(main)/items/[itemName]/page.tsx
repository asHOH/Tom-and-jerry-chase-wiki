import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { items as canonicalItems } from '@/data/static';
import type { Item } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import ItemDetailClient from './ItemDetailsClient';

export function generateStaticParams() {
  return Object.keys(canonicalItems).map((itemName) => ({
    itemName,
  }));
}

function generateStructuredData(itemName: string, item: Item) {
  const desc = item.description ?? `${item.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.name,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    image: item.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/items/${encodeURIComponent(itemName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemName: string }>;
}): Promise<Metadata> {
  const itemName = decodeURIComponent((await params).itemName);
  const { data: item } = await getPublishedEntityRouteReadModel('items', itemName);

  if (!item) {
    return {};
  }

  const desc = item.description ?? `${item.name}详细信息`;
  return generateArticleMetadata({
    title: item.name,
    description: desc,
    keywords: [item.name, '道具'],
    canonicalUrl: getCanonicalUrl(`/items/${encodeURIComponent(itemName)}`),
    imageUrl: item.imageUrl,
  });
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemName: string }>;
}) {
  const itemName = decodeURIComponent((await params).itemName);
  const readModel = await getPublishedEntityRouteReadModel('items', itemName);
  const item = readModel.data;

  if (!item) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(itemName, item)} />
      <ItemDetailClient item={item} itemName={itemName} publishedRevision={readModel.revision} />
    </>
  );
}
