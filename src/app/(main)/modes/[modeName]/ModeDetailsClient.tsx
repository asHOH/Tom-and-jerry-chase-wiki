'use client';

import dynamic from 'next/dynamic';

import type { MapModeRelationCharacterLookup } from '@/lib/gameData/published/clientProjections';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import type { PublishedEntityHistoryEntry } from '@/context/PublishedEntityHistoryContext';
import type { Mode } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const ModeDetails = dynamic(() => import('@/features/modes/components/mode-detail/ModeDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载游戏模式详情中...' />,
});

export default function ModeDetailsClient({
  mode,
  modeName,
  publishedRevision,
  publishedHistory,
  mapsData,
  charactersData,
}: {
  mode: Mode;
  modeName: string;
  publishedRevision: `v1:${string}`;
  publishedHistory: readonly PublishedEntityHistoryEntry[];
  mapsData: PublishedGameDataByType['maps'];
  charactersData: MapModeRelationCharacterLookup;
}) {
  return (
    <EditModePageShell
      entityType='modes'
      entityId={modeName}
      entityName={modeName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <ModeDetails mode={mode} mapsData={mapsData} charactersData={charactersData} />
    </EditModePageShell>
  );
}
