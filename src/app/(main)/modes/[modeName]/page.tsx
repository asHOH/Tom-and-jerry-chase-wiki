import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { modes as canonicalModes } from '@/data/static';
import type { Mode } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import ModeDetailClient from './ModeDetailsClient';

export function generateStaticParams() {
  return Object.keys(canonicalModes).map((modeName) => ({
    modeName,
  }));
}

function generateStructuredData(modeName: string, mode: Mode) {
  const desc = mode.description ?? `${mode.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: mode.name,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    image: mode.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/modes/${encodeURIComponent(modeName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modeName: string }>;
}): Promise<Metadata> {
  const modeName = decodeURIComponent((await params).modeName);
  const { data: mode } = await getPublishedEntityRouteReadModel('modes', modeName);

  if (!mode) {
    return {};
  }

  const desc = mode.description ?? `${mode.name}详细信息`;
  return generateArticleMetadata({
    title: mode.name,
    description: desc,
    keywords: [mode.name, '道具'],
    canonicalUrl: getCanonicalUrl(`/modes/${encodeURIComponent(modeName)}`),
    imageUrl: mode.imageUrl,
  });
}

export default async function ModeDetailPage({
  params,
}: {
  params: Promise<{ modeName: string }>;
}) {
  const modeName = decodeURIComponent((await params).modeName);
  const readModel = await getPublishedEntityRouteReadModel('modes', modeName);
  const mode = readModel.data;

  if (!mode) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(modeName, mode)} />
      <ModeDetailClient mode={mode} modeName={modeName} publishedRevision={readModel.revision} />
    </>
  );
}
