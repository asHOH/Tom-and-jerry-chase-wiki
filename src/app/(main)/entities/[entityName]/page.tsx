import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedReferenceRoute } from '@/lib/gameData/published/referenceRoute';
import { getReferenceActionSnapshot } from '@/lib/gameData/published/reverseReferences';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { createArticleJsonLd, generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { entities as canonicalEntities } from '@/data/static';
import type { Entity } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import EntityDetailClient from './EntityDetailsClient';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(canonicalEntities).map((entityName) => ({
    entityName,
  }));
}

function generateStructuredData(entityName: string, entity: Entity) {
  const desc = entity.description ?? `${entity.name}详细信息`;
  return createArticleJsonLd({
    headline: entity.name,
    description: desc,
    path: `/entities/${encodeURIComponent(entityName)}`,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entityName: string }>;
}): Promise<Metadata> {
  const entityName = decodeURIComponent((await params).entityName);
  const snapshot = await getReferenceActionSnapshot();
  const { data: entity } = await getPublishedEntityRouteReadModel(
    'entities',
    entityName,
    undefined,
    snapshot
  );

  if (!entity) {
    return {};
  }

  const desc = entity.description ?? `${entity.name}详细信息`;
  return generateArticleMetadata({
    title: entity.name,
    description: desc,
    keywords: [entity.name, '衍生物'],
    canonicalUrl: getCanonicalUrl(`/entities/${encodeURIComponent(entityName)}`),
    imageUrl: entity.imageUrl,
  });
}

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ entityName: string }>;
}) {
  const entityName = decodeURIComponent((await params).entityName);
  const readModel = await getPublishedReferenceRoute('entities', entityName);
  if (!readModel) notFound();
  const entity = readModel.data;
  return (
    <>
      <StructuredData data={generateStructuredData(entityName, entity)} />
      <EntityDetailClient
        entity={entity}
        entityName={entityName}
        referencePage={readModel.referencePage}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
      />
    </>
  );
}
