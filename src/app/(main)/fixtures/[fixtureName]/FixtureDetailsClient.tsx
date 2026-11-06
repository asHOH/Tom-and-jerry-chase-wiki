'use client';

import dynamic from 'next/dynamic';

import type { PackedReferencePage } from '@/lib/gameData/published/reverseReferences';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import type { Fixture } from '@/data/types';
import ReferencePageContent from '@/features/shared/detail-view/ReferencePageContent';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const FixtureDetails = dynamic(
  () => import('@/features/fixtures/components/fixture-detail/FixtureDetails'),
  {
    loading: () => <PageLoadingState type='detail' message='加载地图组件详情中...' />,
  }
);

export default function FixtureDetailsClient({
  fixture,
  fixtureName,
  referencePage,
  publishedRevision,
  publishedHistory,
}: {
  fixture: Fixture;
  fixtureName: string;
  referencePage: PackedReferencePage;
  publishedRevision: `v1:${string}`;
  publishedHistory: PublishedEntityHistory;
}) {
  return (
    <EditModePageShell
      entityType='fixtures'
      entityId={fixtureName}
      entityName={fixtureName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <ReferencePageContent page={referencePage}>
        <FixtureDetails fixture={fixture} />
      </ReferencePageContent>
    </EditModePageShell>
  );
}
