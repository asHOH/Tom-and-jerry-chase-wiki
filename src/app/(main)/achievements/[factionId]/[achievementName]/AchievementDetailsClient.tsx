'use client';

import dynamic from 'next/dynamic';

import type { PackedReferencePage } from '@/lib/gameData/published/reverseReferences';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import type { Achievement, FactionId } from '@/data/types';
import ReferencePageContent from '@/features/shared/detail-view/ReferencePageContent';
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
  referencePage,
  publishedRevision,
  publishedHistory,
}: {
  achievement: Achievement;
  factionId: FactionId;
  achievementName: string;
  referencePage: PackedReferencePage;
  publishedRevision: `v1:${string}`;
  publishedHistory: PublishedEntityHistory;
}) {
  const entityId = `${factionId}.${achievementName}`;

  return (
    <EditModePageShell
      entityType='achievements'
      entityId={entityId}
      entityName={achievementName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <ReferencePageContent page={referencePage}>
        <AchievementDetails achievement={achievement} />
      </ReferencePageContent>
    </EditModePageShell>
  );
}
