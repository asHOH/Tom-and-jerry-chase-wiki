'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const ItemGridClient = dynamic<Props>(
  () => import('@/features/items/components/item-grid/ItemGrid'),
  {
    loading: () => (
      <CatalogPageLoadingState
        type='item-grid'
        message='加载道具列表中...'
        count={LOADING_COUNTS.items}
      />
    ),
  }
);

export default ItemGridClient;
