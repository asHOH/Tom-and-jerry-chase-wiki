'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const BuffGridClient = dynamic<Props>(
  () => import('@/features/buffs/components/buff-grid/BuffGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState type='buff-grid' message='加载状态和效果中...' count={LOADING_COUNTS.buffs} />
      </div>
    ),
    ssr: false,
  }
);

export default BuffGridClient;
