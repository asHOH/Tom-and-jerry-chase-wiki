import { NextResponse } from 'next/server';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { maps as canonicalMaps } from '@/data/static';
import { getSceneMapUrl } from '@/features/maps/sceneMapLinks';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(canonicalMaps)
    .filter((mapName) => getSceneMapUrl(mapName))
    .map((mapName) => ({ mapName }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ mapName: string }> }) {
  const mapName = decodeURIComponent((await params).mapName);
  const sceneMapUrl = getSceneMapUrl(mapName);
  if (!sceneMapUrl) return new NextResponse(null, { status: 404 });
  const { data: map } = await getPublishedEntityRouteReadModel('maps', mapName);
  if (!map) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(sceneMapUrl, 308);
}
