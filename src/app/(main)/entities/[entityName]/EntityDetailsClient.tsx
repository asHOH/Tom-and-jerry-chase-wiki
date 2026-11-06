'use client';

import dynamic from 'next/dynamic';

import type { PackedReferencePage } from '@/lib/gameData/published/reverseReferences';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import type { Entity } from '@/data/types';
import ReferencePageContent from '@/features/shared/detail-view/ReferencePageContent';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const EntityDetails = dynamic(() => import('@/features/entities/entity-detail/EntityDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载衍生物详情中...' />,
});

export default function EntityDetailsClient({
  entity,
  entityName,
  referencePage,
  publishedRevision,
  publishedHistory,
}: {
  entity: Entity;
  entityName: string;
  referencePage: PackedReferencePage;
  publishedRevision: `v1:${string}`;
  publishedHistory: PublishedEntityHistory;
}) {
  return (
    <EditModePageShell
      entityType='entities'
      entityId={entityName}
      entityName={entityName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <ReferencePageContent page={referencePage}>
        <EntityDetails entity={entity} />
      </ReferencePageContent>
    </EditModePageShell>
  );
}
