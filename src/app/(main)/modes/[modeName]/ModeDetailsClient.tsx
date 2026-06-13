'use client';

import dynamic from 'next/dynamic';

import type { Mode } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const ModeDetails = dynamic(() => import('@/features/modes/components/mode-detail/ModeDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载游戏模式详情中...' />,
});

export default function ModeDetailsClient({ mode, modeName }: { mode: Mode; modeName: string }) {
  return (
    <EditModePageShell entityType='modes' entityId={modeName} entityName={modeName}>
      <ModeDetails mode={mode} />
    </EditModePageShell>
  );
}
