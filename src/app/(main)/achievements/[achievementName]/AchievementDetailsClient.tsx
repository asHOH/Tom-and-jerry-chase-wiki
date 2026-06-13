'use client';

import dynamic from 'next/dynamic';

import type { Achievement } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const AchievementDetails = dynamic(
  () => import('@/features/achievements/achievement-detail/AchievementDetails'),
  {
    loading: () => <PageLoadingState type='detail' message='加载成就详情中...' />,
  }
);

export default function AchievementDetailsClient({
  achievement,
  achievementName,
}: {
  achievement: Achievement;
  achievementName: string;
}) {
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
