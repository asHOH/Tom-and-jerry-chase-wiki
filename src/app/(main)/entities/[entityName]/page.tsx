import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import { generateArticleMetadata } from '@/lib/metadataUtils';
import StructuredData from '@/components/StructuredData';
import { entities } from '@/data';

import EntityDetailClient from './EntityDetailsClient';

export function generateStaticParams() {
  return Object.keys(entities).map((entityName) => ({
    entityName,
  }));
}

function generateStructuredData(entityName: string): WithContext<Article> {
  const entity = allentities[entityName]!;

  const desc = entity.description ?? `${entity.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${entity.name} - 猫鼠wiki`,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/entities/${encodeURIComponent(entityName)}`,
    },
  };
}

const allentities = { ...entities['cat'], ...entities['mouse'] };
export async function generateMetadata({
  params,
}: {
  params: Promise<{ entityName: string }>;
}): Promise<Metadata> {
  const entityName = decodeURIComponent((await params).entityName);
  const entity = allentities[entityName];

  if (!entity) {
    return {};
  }

  const desc = entity.description ?? `${entity.name}详细信息`;
  return generateArticleMetadata({
    title: entity.name,
    description: desc,
    keywords: [entity.name, '衍生物'],
    canonicalUrl: `https://tjwiki.com/entities/${encodeURIComponent(entityName)}`,
    imageUrl: entity.imageUrl,
  });
}

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ entityName: string }>;
}) {
  const entityName = decodeURIComponent((await params).entityName);
  const entity = allentities[entityName];

  if (!entity) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(entityName)} />
      <EntityDetailClient entity={entity} />
    </>
  );
}
