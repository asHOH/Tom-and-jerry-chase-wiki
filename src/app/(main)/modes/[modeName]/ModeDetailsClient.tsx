'use client';

import dynamic from 'next/dynamic';

import type { Mode } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

const ModeDetails = dynamic(() => import('@/features/modes/components/mode-detail/ModeDetails'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <LoadingState type='detail' message='加载游戏模式详情中...' />
    </div>
  ),
});

export default function ModeDetailsClient({ mode, modeName }: { mode: Mode; modeName: string }) {
  return (
    <EditModePageShell entityType='modes' entityId={modeName} entityName={modeName}>
      <ModeDetails mode={mode} />
    </EditModePageShell>
  );
}
