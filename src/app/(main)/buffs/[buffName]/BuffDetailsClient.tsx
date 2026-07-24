'use client';

import dynamic from 'next/dynamic';

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
}: {
  buff: Buff;
  buffName: string;
  publishedRevision: `v1:${string}`;
}) {
  return (
    <EditModePageShell
      entityType='buffs'
      entityId={buffName}
      entityName={buffName}
      publishedRevision={publishedRevision}
    >
      <BuffDetails buff={buff} />
    </EditModePageShell>
  );
}
