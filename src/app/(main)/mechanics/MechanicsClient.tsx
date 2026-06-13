'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { PageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const MechanicsClient = dynamic<Props>(() => import('@/features/mechanics/mechanicsSection'), {
  loading: () => (
    <PageLoadingState
      layout='catalog'
      type='item-grid'
      message='加载局内机制中...'
      count={LOADING_COUNTS.mechanicsSections}
    />
  ),
});

export default MechanicsClient;
