import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { createArticleJsonLd, generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { fixtures as canonicalFixtures } from '@/data/static';
import type { Fixture } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import FixtureDetailClient from './FixtureDetailsClient';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(canonicalFixtures).map((fixtureName) => ({
    fixtureName,
  }));
}

function generateStructuredData(fixtureName: string, fixture: Fixture) {
  const desc = fixture.description ?? `${fixture.name}详细信息`;
  return createArticleJsonLd({
    headline: fixture.name,
    description: desc,
    image: fixture.imageUrl,
    path: `/fixtures/${encodeURIComponent(fixtureName)}`,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fixtureName: string }>;
}): Promise<Metadata> {
  const fixtureName = decodeURIComponent((await params).fixtureName);
  const { data: fixture } = await getPublishedEntityRouteReadModel('fixtures', fixtureName);

  if (!fixture) {
    return {};
  }

  const desc = fixture.description ?? `${fixture.name}详细信息`;
  return generateArticleMetadata({
    title: fixture.name,
    description: desc,
    keywords: [fixture.name, '道具'],
    canonicalUrl: getCanonicalUrl(`/fixtures/${encodeURIComponent(fixtureName)}`),
    imageUrl: fixture.imageUrl,
  });
}

export default async function FixtureDetailPage({
  params,
}: {
  params: Promise<{ fixtureName: string }>;
}) {
  const fixtureName = decodeURIComponent((await params).fixtureName);
  const readModel = await getPublishedEntityRouteReadModel('fixtures', fixtureName);
  const fixture = readModel.data;

  if (!fixture) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(fixtureName, fixture)} />
      <FixtureDetailClient
        fixture={fixture}
        fixtureName={fixtureName}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
      />
    </>
  );
}
