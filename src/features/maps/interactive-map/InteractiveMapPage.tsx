'use client';

import dynamic from 'next/dynamic';
import { useSnapshot } from 'valtio';

import { useEditMode } from '@/context/EditModeContext';
import type { InteractiveMapConfig, Map as MapType } from '@/data/types';
import EditButton from '@/components/ui/EditButton';
import EditModePageShell from '@/components/ui/EditModePageShell';
import Link from '@/components/Link';
import { mapsEdit } from '@/data';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), { ssr: false });

type InteractiveMapPageProps = {
  map: MapType;
  mapName: string;
};

function InteractiveMapPageContent({ map, mapName }: InteractiveMapPageProps) {
  const { isEditMode } = useEditMode();
  const rawLocalMap = mapsEdit[mapName];
  const localMapSnapshot = useSnapshot(rawLocalMap ?? ({} as MapType));
  const effectiveMap = isEditMode && rawLocalMap ? (localMapSnapshot as MapType) : map;
  const interactiveMap = effectiveMap.interactiveMap;

  if (!interactiveMap) return null;

  return (
    <div className='relative h-dvh w-screen overflow-hidden bg-slate-950'>
      <InteractiveMap
        config={interactiveMap}
        mapName={effectiveMap.name}
        isEditMode={isEditMode}
        alwaysFullscreen
        fallbackImageUrl={effectiveMap.mapImageUrl}
        onConfigChange={
          isEditMode && rawLocalMap
            ? (config: InteractiveMapConfig) => {
                rawLocalMap.interactiveMap = config;
              }
            : undefined
        }
      />
      <div className='absolute top-3 right-3 z-[1100] flex gap-2'>
        {!isEditMode && <EditButton className='shadow-lg' />}
        <Link
          href={`/maps/${encodeURIComponent(mapName)}`}
          preserveEditParam
          className='rounded-md bg-slate-900/90 px-3 py-2 text-sm text-white shadow hover:bg-slate-800'
        >
          返回地图详情
        </Link>
      </div>
    </div>
  );
}

export default function InteractiveMapPage({ map, mapName }: InteractiveMapPageProps) {
  return (
    <EditModePageShell entityType='maps' entityId={mapName} entityName={mapName}>
      <InteractiveMapPageContent map={map} mapName={mapName} />
    </EditModePageShell>
  );
}
