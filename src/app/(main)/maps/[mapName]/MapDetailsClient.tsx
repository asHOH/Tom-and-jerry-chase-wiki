'use client';

import dynamic from 'next/dynamic';

import type { MapModeRelationCharacterLookup } from '@/lib/gameData/published/clientProjections';
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
  fixtureNames,
  modeNames,
  charactersData,
}: {
  map: Map;
  mapName: string;
  publishedRevision: `v1:${string}`;
  publishedHistory: readonly PublishedEntityHistoryEntry[];
  fixtureNames: readonly string[];
  modeNames: readonly string[];
  charactersData: MapModeRelationCharacterLookup;
}) {
  return (
    <EditModePageShell
      entityType='maps'
      entityId={mapName}
      entityName={mapName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <MapDetails
        map={map}
        fixtureNames={fixtureNames}
        modeNames={modeNames}
        charactersData={charactersData}
      />
    </EditModePageShell>
  );
}
