'use client';

import dynamic from 'next/dynamic';

import type { PublishedEntityHistoryEntry } from '@/context/PublishedEntityHistoryContext';
import type { Buff } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const BuffDetails = dynamic(() => import('@/features/buffs/components/buff-detail/BuffDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载状态详情中...' />,
});

export default function BuffDetailsClient({
  buff,
  buffName,
  publishedRevision,
  publishedHistory,
}: {
  buff: Buff;
  buffName: string;
  publishedRevision: `v1:${string}`;
  publishedHistory: readonly PublishedEntityHistoryEntry[];
}) {
  return (
    <EditModePageShell
      entityType='buffs'
      entityId={buffName}
      entityName={buffName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <BuffDetails buff={buff} />
    </EditModePageShell>
  );
}
