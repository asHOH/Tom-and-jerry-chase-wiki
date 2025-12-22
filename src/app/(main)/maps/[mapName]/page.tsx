import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateArticleMetadata } from '@/lib/metadataUtils';
import StructuredData from '@/components/StructuredData';
import { maps } from '@/data';

import MapDetailClient from './MapDetailsClient';

export function generateStaticParams() {
  return Object.keys(maps).map((mapName) => ({
    mapName,
  }));
}

function generateStructuredData(mapName: string) {
  const map = maps[mapName]!;
  const desc = map.description ?? `${map.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${map.name} - 猫鼠wiki`,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    image: map.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/maps/${encodeURIComponent(mapName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mapName: string }>;
}): Promise<Metadata> {
  const mapName = decodeURIComponent((await params).mapName);
  const map = maps[mapName];

  if (!map) {
    return {};
  }

  const desc = map.description ?? `${map.name}详细信息`;
  return generateArticleMetadata({
    title: map.name,
    description: desc,
    keywords: [map.name, '地图'],
    canonicalUrl: `https://tjwiki.com/maps/${encodeURIComponent(mapName)}`,
    imageUrl: map.imageUrl,
  });
}

export default async function MapDetailPage({ params }: { params: Promise<{ mapName: string }> }) {
  const mapName = decodeURIComponent((await params).mapName);
  const map = maps[mapName];

  if (!map) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(mapName)} />
      <MapDetailClient map={map} />
    </>
  );
}
