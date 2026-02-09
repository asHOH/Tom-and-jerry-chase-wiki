'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const ItemGroupGridClient = dynamic<Props>(
  () => import('@/features/items/components/itemGroups/itemGroup-grid/ItemGroupGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState type='item-grid' message='加载组合列表中...' count={12} />
      </div>
    ),
    ssr: false,
  }
);

export default ItemGroupGridClient;
