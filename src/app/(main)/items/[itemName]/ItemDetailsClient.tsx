'use client';

import dynamic from 'next/dynamic';

import type { Item } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const ItemDetails = dynamic(() => import('@/features/items/components/item-detail/ItemDetails'), {
  loading: () => <PageLoadingState type='detail' message='加载道具详情中...' />,
});

export default function ItemDetailsClient({ item, itemName }: { item: Item; itemName: string }) {
  return (
    <EditModePageShell entityType='items' entityId={itemName} entityName={itemName}>
      <ItemDetails item={item} />
    </EditModePageShell>
  );
}
