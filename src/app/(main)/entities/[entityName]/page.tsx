import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
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

function generateStructuredData(entityName: string, entity: Entity): WithContext<Article> {
  const desc = entity.description ?? `${entity.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entity.name,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/entities/${encodeURIComponent(entityName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entityName: string }>;
}): Promise<Metadata> {
  const entityName = decodeURIComponent((await params).entityName);
  const { data: entity } = await getPublishedEntityRouteReadModel('entities', entityName);

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
  const readModel = await getPublishedEntityRouteReadModel('entities', entityName);
  const entity = readModel.data;

  if (!entity) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(entityName, entity)} />
      <EntityDetailClient
        entity={entity}
        entityName={entityName}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
      />
    </>
  );
}
