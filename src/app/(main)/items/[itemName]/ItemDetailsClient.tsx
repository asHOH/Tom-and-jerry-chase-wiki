'use client';

import dynamic from 'next/dynamic';

import type { PackedReferencePage } from '@/lib/gameData/published/reverseReferences';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import type { Item } from '@/data/types';
import ReferencePageContent from '@/features/shared/detail-view/ReferencePageContent';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const ItemDetails = dynamic(() => import('@/features/items/components/item-detail/ItemDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载道具详情中...' />,
});

export default function ItemDetailsClient({
  item,
  itemName,
  referencePage,
  publishedRevision,
  publishedHistory,
}: {
  item: Item | null;
  itemName: string;
  referencePage: PackedReferencePage;
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
      <ReferencePageContent page={referencePage}>
        <ItemDetails item={item} itemName={itemName} />
      </ReferencePageContent>
    </EditModePageShell>
  );
}
