'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const MechanicsClient = dynamic<Props>(() => import('@/features/mechanics/mechanicsSection'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
      <LoadingState
        type='item-grid'
        message='加载局内机制中...'
        count={LOADING_COUNTS.mechanicsSections}
      />
    </div>
  ),
  ssr: false,
});

export default MechanicsClient;
