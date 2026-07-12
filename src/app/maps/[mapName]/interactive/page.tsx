import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import InteractiveMapPage from '@/features/maps/interactive-map/InteractiveMapPage';
import { maps } from '@/data';

export function generateStaticParams() {
  return Object.entries(maps)
    .filter(([, map]) => map.interactiveMap)
    .map(([mapName]) => ({ mapName }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mapName: string }>;
}): Promise<Metadata> {
  const mapName = decodeURIComponent((await params).mapName);
  const map = maps[mapName];

  return map?.interactiveMap ? { title: `${map.name}交互地图` } : {};
}

export default async function InteractiveMapRoute({
  params,
}: {
  params: Promise<{ mapName: string }>;
}) {
  const mapName = decodeURIComponent((await params).mapName);
  const map = maps[mapName];

  if (!map?.interactiveMap) notFound();

  return <InteractiveMapPage map={map} mapName={mapName} />;
}
