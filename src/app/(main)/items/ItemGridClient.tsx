'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const ItemGridClient = dynamic<Props>(
  () => import('@/features/items/components/item-grid/ItemGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState type='item-grid' message='加载道具列表中...' count={LOADING_COUNTS.items} />
      </div>
    ),
    ssr: false,
  }
);

export default ItemGridClient;
