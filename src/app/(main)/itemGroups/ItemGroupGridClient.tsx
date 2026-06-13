'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { PageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const ItemGroupGridClient = dynamic<Props>(
  () => import('@/features/items/components/itemGroups/itemGroup-grid/ItemGroupGrid'),
  {
    loading: () => (
      <PageLoadingState
        layout='catalog'
        type='item-grid'
        message='加载组合列表中...'
        count={LOADING_COUNTS.itemGroups}
      />
    ),
  }
);

export default ItemGroupGridClient;
