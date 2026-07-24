import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { maps as canonicalMaps } from '@/data/static';
import InteractiveMapPage from '@/features/maps/interactive-map/InteractiveMapPage';

export function generateStaticParams() {
  return Object.entries(canonicalMaps)
    .filter(([, map]) => map.interactiveMap)
    .map(([mapName]) => ({ mapName }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mapName: string }>;
}): Promise<Metadata> {
  const mapName = decodeURIComponent((await params).mapName);
  const { data: map } = await getPublishedEntityRouteReadModel('maps', mapName);

  return map?.interactiveMap ? { title: map.name } : {};
}

export default async function InteractiveMapRoute({
  params,
}: {
  params: Promise<{ mapName: string }>;
}) {
  const mapName = decodeURIComponent((await params).mapName);
  const readModel = await getPublishedEntityRouteReadModel('maps', mapName);
  const map = readModel.data;

  if (!map?.interactiveMap) notFound();

  return <InteractiveMapPage map={map} mapName={mapName} publishedRevision={readModel.revision} />;
}
