'use client';

import dynamic from 'next/dynamic';

import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import type { PublishedEntityHistoryEntry } from '@/context/PublishedEntityHistoryContext';
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
  publishedHistory,
  fixturesData,
  modesData,
}: {
  map: Map;
  mapName: string;
  publishedRevision: `v1:${string}`;
  publishedHistory: readonly PublishedEntityHistoryEntry[];
  fixturesData: PublishedGameDataByType['fixtures'];
  modesData: PublishedGameDataByType['modes'];
}) {
  return (
    <EditModePageShell
      entityType='maps'
      entityId={mapName}
      entityName={mapName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <MapDetails map={map} fixturesData={fixturesData} modesData={modesData} />
    </EditModePageShell>
  );
}
