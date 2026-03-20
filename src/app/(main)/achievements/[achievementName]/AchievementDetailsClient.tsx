'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { getPathSegmentFromEnd } from '@/lib/edit/editModeRouteUtils';
import type { Achievement } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

const AchievementDetails = dynamic(
  () => import('@/features/achievements/achievement-detail/AchievementDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载成就详情中...' />
      </div>
    ),
    ssr: false,
  }
);

export default function AchievementDetailsClient({ achievement }: { achievement: Achievement }) {
  const pathname = usePathname();
  const achievementName = getPathSegmentFromEnd(pathname, 0) || achievement.name;

  return (
    <EditModePageShell
      entityType='achievements'
      entityId={achievementName}
      entityName={achievementName}
    >
      <AchievementDetails achievement={achievement} />
    </EditModePageShell>
  );
}
