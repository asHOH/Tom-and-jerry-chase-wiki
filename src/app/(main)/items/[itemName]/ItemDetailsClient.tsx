'use client';

import type { ComponentProps } from 'react';
import dynamic from 'next/dynamic';

import { restoreReferenceRevisions } from '@/lib/gameData/published/referenceRevisionProps';
import type { PackedSection } from '@/lib/referenceProjection';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import type { Item } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';
import PublishedRevisionBoundary from '@/components/PublishedRevisionBoundary';

const ItemDetails = dynamic(() => import('@/features/items/components/item-detail/ItemDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载道具详情中...' />,
});

export default function ItemDetailsClient({
  item,
  itemName,
  references,
  relatedRevisions,
  publishedRevision,
  publishedHistory,
}: {
  item: Item | null;
  itemName: string;
  references: PackedSection;
  relatedRevisions: ComponentProps<typeof PublishedRevisionBoundary>['revisions'];
  publishedRevision: `v1:${string}`;
  publishedHistory: PublishedEntityHistory;
}) {
  return (
    <EditModePageShell
      entityType='items'
      entityId={itemName}
      entityName={itemName}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <PublishedRevisionBoundary revisions={restoreReferenceRevisions(relatedRevisions, 'items')}>
        <ItemDetails item={item} itemName={itemName} references={references} />
      </PublishedRevisionBoundary>
    </EditModePageShell>
  );
}
