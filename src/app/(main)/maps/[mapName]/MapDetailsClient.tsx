'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { getPathSegmentFromEnd } from '@/lib/edit/editModeRouteUtils';
import type { Map } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

const MapDetails = dynamic(() => import('@/features/maps/map-detail/MapDetails'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <LoadingState type='detail' message='加载地图详情中...' />
    </div>
  ),
  ssr: false,
});

export default function MapDetailsClient({ map }: { map: Map }) {
  const pathname = usePathname();
  const mapName = getPathSegmentFromEnd(pathname, 0) || map.name;

  return (
    <EditModePageShell entityType='maps' entityId={mapName} entityName={mapName}>
      <MapDetails map={map} />
    </EditModePageShell>
  );
}
