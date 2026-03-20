'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { getPathSegmentFromEnd } from '@/lib/edit/editModeRouteUtils';
import type { Entity } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

const EntityDetails = dynamic(() => import('@/features/entities/entity-detail/EntityDetails'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <LoadingState type='detail' message='加载衍生物详情中...' />
    </div>
  ),
  ssr: false,
});

export default function EntityDetailsClient({ entity }: { entity: Entity }) {
  const pathname = usePathname();
  const entityName = getPathSegmentFromEnd(pathname, 0) || entity.name;

  return (
    <EditModePageShell entityType='entities' entityId={entityName} entityName={entityName}>
      <EntityDetails entity={entity} />
    </EditModePageShell>
  );
}
