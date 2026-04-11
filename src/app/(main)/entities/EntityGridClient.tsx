'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const EntityGridClient = dynamic<Props>(
  () => import('@/features/entities/entity-grid/EntityGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState
          type='item-grid'
          message='加载衍生物列表中...'
          count={LOADING_COUNTS.entities}
        />
      </div>
    ),
    ssr: false,
  }
);

export default EntityGridClient;
