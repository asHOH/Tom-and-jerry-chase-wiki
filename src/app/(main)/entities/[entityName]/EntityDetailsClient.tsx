'use client';

import dynamic from 'next/dynamic';

import type { Entity } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const EntityDetails = dynamic(() => import('@/features/entities/entity-detail/EntityDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载衍生物详情中...' />,
});

export default function EntityDetailsClient({
  entity,
  entityName,
  publishedRevision,
}: {
  entity: Entity;
  entityName: string;
  publishedRevision: `v1:${string}`;
}) {
  return (
    <EditModePageShell
      entityType='entities'
      entityId={entityName}
      entityName={entityName}
      publishedRevision={publishedRevision}
    >
      <EntityDetails entity={entity} />
    </EditModePageShell>
  );
}
