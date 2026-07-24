import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { maps as canonicalMaps } from '@/data/static';
import type { Map as GameMap } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import MapDetailClient from './MapDetailsClient';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(canonicalMaps).map((mapName) => ({
    mapName,
  }));
}

function generateStructuredData(mapName: string, map: GameMap) {
  const desc = map.description ?? `${map.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: map.name,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    image: map.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/maps/${encodeURIComponent(mapName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mapName: string }>;
}): Promise<Metadata> {
  const mapName = decodeURIComponent((await params).mapName);
  const { data: map } = await getPublishedEntityRouteReadModel('maps', mapName);

  if (!map) {
    return {};
  }

  const desc = map.description ?? `${map.name}详细信息`;
  return generateArticleMetadata({
    title: map.name,
    description: desc,
    keywords: [map.name, '地图'],
    canonicalUrl: getCanonicalUrl(`/maps/${encodeURIComponent(mapName)}`),
    imageUrl: map.imageUrl,
  });
}

export default async function MapDetailPage({ params }: { params: Promise<{ mapName: string }> }) {
  const mapName = decodeURIComponent((await params).mapName);
  const snapshot = await getApprovedActionSnapshot();
  const [readModel, fixtures, modes] = await Promise.all([
    getPublishedEntityRouteReadModel('maps', mapName, undefined, snapshot),
    getPublishedDomainReadModel('fixtures', snapshot),
    getPublishedDomainReadModel('modes', snapshot),
  ]);
  const map = readModel.data;

  if (!map) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(mapName, map)} />
      <MapDetailClient
        map={map}
        mapName={mapName}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
        fixturesData={fixtures.data}
        modesData={modes.data}
      />
    </>
  );
}
