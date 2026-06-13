'use client';

import dynamic from 'next/dynamic';

import { PageLoadingState } from '@/components/ui/LoadingState';

const ItemGroupDetailsClient = dynamic(
  () => import('@/features/items/components/itemGroups/itemGroup-detail/ItemGroupDetails'),
  {
    loading: () => <PageLoadingState type='detail' message='加载组合详情中...' />,
  }
);

export default ItemGroupDetailsClient;
