'use client';

import dynamic from 'next/dynamic';

import type { PackedReferencePage } from '@/lib/gameData/published/reverseReferences';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import type { Buff } from '@/data/types';
import ReferencePageContent from '@/features/shared/detail-view/ReferencePageContent';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const BuffDetails = dynamic(() => import('@/features/buffs/components/buff-detail/BuffDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载状态详情中...' />,
});

export default function BuffDetailsClient({
  buff,
  buffName,
  referencePage,
  publishedRevision,
  publishedHistory,
}: {
  buff: Buff;
  buffName: string;
  referencePage: PackedReferencePage;
  publishedRevision: `v1:${string}`;
  publishedHistory: PublishedEntityHistory;
}) {
  return (
    <EditModePageShell
      entityType='buffs'
      entityId={buffName}
      entityName={buffName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <ReferencePageContent page={referencePage}>
        <BuffDetails buff={buff} />
      </ReferencePageContent>
    </EditModePageShell>
  );
}
