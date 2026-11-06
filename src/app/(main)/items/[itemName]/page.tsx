import { isDeepStrictEqual } from 'node:util';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { packReferenceRevisions } from '@/lib/gameData/published/referenceRevisionProps';
import {
  getPublishedReferenceSections,
  getReferenceActionSnapshot,
  packPublishedReferenceSection,
} from '@/lib/gameData/published/reverseReferences';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { createArticleJsonLd, generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import type { Item } from '@/data/types';
import canonicalItems from '@/features/items/data/items';
import StructuredData from '@/components/StructuredData';

import ItemDetailClient from './ItemDetailsClient';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(canonicalItems).map((itemName) => ({
    itemName,
  }));
}

function generateStructuredData(itemName: string, item: Item) {
  const desc = item.description ?? `${item.name}详细信息`;
  return createArticleJsonLd({
    headline: item.name,
    description: desc,
    image: item.imageUrl,
    path: `/items/${encodeURIComponent(itemName)}`,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemName: string }>;
}): Promise<Metadata> {
  const itemName = decodeURIComponent((await params).itemName);
  const snapshot = await getReferenceActionSnapshot();
  const { data: item } = await getPublishedEntityRouteReadModel(
    'items',
    itemName,
    undefined,
    snapshot
  );

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
  const snapshot = await getReferenceActionSnapshot();
  const readModel = await getPublishedEntityRouteReadModel('items', itemName, undefined, snapshot);
  const item = readModel.data;

  if (!item) {
    notFound();
  }

  const { sections, revisions } = await getPublishedReferenceSections(snapshot, [
    { name: item.name, sourceId: itemName, type: 'item' },
  ]);
  const { items: _primaryRevision, ...relatedRevisions } = revisions;
  return (
    <>
      <StructuredData data={generateStructuredData(itemName, item)} />
      <ItemDetailClient
        item={isDeepStrictEqual(item, canonicalItems[itemName]) ? null : item}
        itemName={itemName}
        references={packPublishedReferenceSection(sections[0]!)}
        relatedRevisions={packReferenceRevisions(relatedRevisions)}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
      />
    </>
  );
}
