'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const ItemDetailsClient = dynamic(
  () => import('@/features/items/components/item-detail/ItemDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载道具详情中...' />
      </div>
    ),
    ssr: false,
  }
);

export default ItemDetailsClient;
