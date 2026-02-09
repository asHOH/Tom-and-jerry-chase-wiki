'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const ItemGroupDetailsClient = dynamic(
  () => import('@/features/items/components/itemGroups/itemGroup-detail/ItemGroupDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState type='detail' message='加载组合详情中...' />
      </div>
    ),
    ssr: false,
  }
);

export default ItemGroupDetailsClient;
