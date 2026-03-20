'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { getPathSegmentFromEnd } from '@/lib/edit/editModeRouteUtils';
import type { Mode } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

const ModeDetails = dynamic(() => import('@/features/modes/components/mode-detail/ModeDetails'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <LoadingState type='detail' message='加载游戏模式详情中...' />
    </div>
  ),
  ssr: false,
});

export default function ModeDetailsClient({ mode }: { mode: Mode }) {
  const pathname = usePathname();
  const modeName = getPathSegmentFromEnd(pathname, 0) || mode.name;

  return (
    <EditModePageShell entityType='modes' entityId={modeName} entityName={modeName}>
      <ModeDetails mode={mode} />
    </EditModePageShell>
  );
}
