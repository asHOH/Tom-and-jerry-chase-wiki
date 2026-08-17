'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useEditMode } from '@/context/EditModeContext';
import type { InteractiveMapConfig, Map as MapType } from '@/data/types';
import EditButton from '@/components/ui/EditButton';
import EditModePageShell from '@/components/ui/EditModePageShell';
import Link from '@/components/Link';

// import LandscapeOrientationPrompt from './LandscapeOrientationPrompt';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), { ssr: false });

type InteractiveMapPageProps = {
  map: MapType;
  mapName: string;
  publishedRevision: `v1:${string}`;
};

function InteractiveMapPageContent({ map, mapName }: InteractiveMapPageProps) {
  const { isEditMode, isEditModeRequested, runtimeStatus } = useEditMode();
  const orientationContainerRef = useRef<HTMLDivElement>(null);
  const editRuntime = useDraftDataRuntime();
  const rawLocalMap = editRuntime?.stores.maps[mapName];
  const localMapSnapshot = useOptionalEditSnapshot(rawLocalMap, map);
  const usesDraftData = isEditModeRequested && runtimeStatus === 'ready';
  const effectiveMap = usesDraftData && rawLocalMap ? (localMapSnapshot as MapType) : map;
  const interactiveMap = effectiveMap.interactiveMap;

  useEffect(() => {
    const root = document.documentElement;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    root.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  if (!interactiveMap) return null;

  return (
    <div
      ref={orientationContainerRef}
      className='fixed inset-0 z-1000 h-dvh w-full overflow-hidden bg-slate-950'
    >
      {/* <LandscapeOrientationPrompt fullscreenTargetRef={orientationContainerRef} /> */}
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
      <div className='absolute top-3 right-3 z-1100 flex gap-2'>
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

export default function InteractiveMapPage({
  map,
  mapName,
  publishedRevision,
}: InteractiveMapPageProps) {
  return (
    <EditModePageShell
      entityType='maps'
      entityId={mapName}
      entityName={mapName}
      publishedRevision={publishedRevision}
      withPageShell={false}
    >
      <InteractiveMapPageContent
        map={map}
        mapName={mapName}
        publishedRevision={publishedRevision}
      />
    </EditModePageShell>
  );
}
