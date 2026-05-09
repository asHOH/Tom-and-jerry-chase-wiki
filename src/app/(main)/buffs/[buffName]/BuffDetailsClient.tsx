'use client';

import dynamic from 'next/dynamic';

import type { Buff } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

const BuffDetails = dynamic(() => import('@/features/buffs/components/buff-detail/BuffDetails'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <LoadingState type='detail' message='加载状态详情中...' />
    </div>
  ),
});

export default function BuffDetailsClient({ buff, buffName }: { buff: Buff; buffName: string }) {
  return (
    <EditModePageShell entityType='buffs' entityId={buffName} entityName={buffName}>
      <BuffDetails buff={buff} />
    </EditModePageShell>
  );
}
