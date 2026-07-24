'use client';

import dynamic from 'next/dynamic';

import type { Achievement, FactionId } from '@/data/types';
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
  factionId,
  achievementName,
  publishedRevision,
}: {
  achievement: Achievement;
  factionId: FactionId;
  achievementName: string;
  publishedRevision: `v1:${string}`;
}) {
  const entityId = `${factionId}.${achievementName}`;

  return (
    <EditModePageShell
      entityType='achievements'
      entityId={entityId}
      entityName={achievementName}
      publishedRevision={publishedRevision}
    >
      <AchievementDetails achievement={achievement} />
    </EditModePageShell>
  );
}
