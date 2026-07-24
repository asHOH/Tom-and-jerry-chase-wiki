'use client';

import dynamic from 'next/dynamic';

import type { Map } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const MapDetails = dynamic(() => import('@/features/maps/map-detail/MapDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载地图详情中...' />,
});

export default function MapDetailsClient({
  map,
  mapName,
  publishedRevision,
}: {
  map: Map;
  mapName: string;
  publishedRevision: `v1:${string}`;
}) {
  return (
    <EditModePageShell
      entityType='maps'
      entityId={mapName}
      entityName={mapName}
      publishedRevision={publishedRevision}
    >
      <MapDetails map={map} />
    </EditModePageShell>
  );
}
